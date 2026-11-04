import type { DiffbotClient } from "./client.js";
import { ValidationError } from "./errors.js";
import { readBodyText, raiseForStatus } from "./http.js";
import type { JsonObject } from "./json.js";

export interface ChatMessage {
  role: string;
  content: string;
}

const MODEL = "diffbot-small-xl";

/** `response_format` types accepted by the Diffbot LLM endpoint. */
export const RESPONSE_FORMAT_TYPES = ["text", "json_object", "json_schema"] as const;
export type ResponseFormatType = (typeof RESPONSE_FORMAT_TYPES)[number];

export interface ResponseFormat {
  type: ResponseFormatType;
  json_schema?: { name?: string; schema: JsonObject };
}

export interface AskOptions {
  /**
   * Constrain the output, e.g. `{ type: "json_object" }` or `jsonSchemaFormat(schema)`.
   * Prefer a schema: `json_object` applies no server-side grammar.
   */
  responseFormat?: ResponseFormat;
}

/**
 * Build a `response_format` that constrains output to `schema`. The endpoint requires
 * the schema nested under `json_schema.schema`; anywhere else is ignored server-side
 * without an error, so prefer this helper over hand-building the object.
 */
export function jsonSchemaFormat(schema: JsonObject, name = "response"): ResponseFormat {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) {
    throw new ValidationError("schema must be a JSON Schema object");
  }
  return { type: "json_schema", json_schema: { name, schema } };
}

/** Reject shapes the endpoint would accept but silently not enforce. */
function validateResponseFormat(responseFormat: ResponseFormat | undefined): void {
  if (responseFormat === undefined) return;
  if (responseFormat === null || typeof responseFormat !== "object" || Array.isArray(responseFormat)) {
    throw new ValidationError("responseFormat must be an object");
  }
  const fmtType = responseFormat.type ?? "text";
  if (!(RESPONSE_FORMAT_TYPES as readonly string[]).includes(fmtType)) {
    throw new ValidationError(
      `responseFormat type must be one of ${RESPONSE_FORMAT_TYPES.join(", ")}; got ${JSON.stringify(fmtType)}`,
    );
  }
  if (fmtType === "json_schema") {
    const jsonSchema = responseFormat.json_schema;
    if (jsonSchema === null || typeof jsonSchema !== "object" || !("schema" in jsonSchema)) {
      throw new ValidationError(
        'responseFormat { type: "json_schema" } requires the schema nested as ' +
          "{ json_schema: { schema: {...} } }. Without it the server returns 200 and " +
          "ignores the constraint. Use jsonSchemaFormat(schema) to build it.",
      );
    }
  }
}

// The RAG loop may prefix its final answer with a think block, and the model
// occasionally wraps JSON in a markdown fence despite being told not to.
const THINK_BLOCK = /<think>[\s\S]*?<\/think>/g;
const JSON_FENCE = /^```(?:json)?\s*|\s*```$/gm;

/** Parse the model's final answer as JSON, tolerating think blocks and fences. */
export function extractJson(text: string): unknown {
  let cleaned = text.replace(THINK_BLOCK, "").trim();
  cleaned = cleaned.replace(JSON_FENCE, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through to span search
  }

  // Fall back to the outermost object or array span in the response.
  const spans: Array<[number, string]> = [];
  for (const [opener, closer] of [
    ["{", "}"],
    ["[", "]"],
  ] as const) {
    const start = cleaned.indexOf(opener);
    const end = cleaned.lastIndexOf(closer);
    if (start !== -1 && end > start) spans.push([start, cleaned.slice(start, end + 1)]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  for (const [, span] of spans) {
    try {
      return JSON.parse(span);
    } catch {
      continue;
    }
  }

  throw new ValidationError(
    `could not parse JSON from the model response: ${JSON.stringify(text.slice(0, 200))}`,
  );
}

/**
 * Schema used when the caller wants JSON but has no shape in mind. This goes through
 * the json_schema path rather than `{ type: "json_object" }` on purpose: json_object
 * applies no server-side grammar, so the RAG loop's internal <functioncall> JSON
 * satisfies it and gets returned as the final answer. That is reproducible whenever
 * the request carries a system message.
 */
export const ANY_OBJECT_SCHEMA: JsonObject = { type: "object" };

function resolveFormat(
  schema: JsonObject | undefined,
  responseFormat: ResponseFormat | undefined,
): ResponseFormat {
  if (schema !== undefined && responseFormat !== undefined) {
    throw new ValidationError("pass either schema or responseFormat, not both");
  }
  if (responseFormat !== undefined) return responseFormat;
  return jsonSchemaFormat(schema ?? ANY_OBJECT_SCHEMA);
}

/** Catch the internal tool call surfacing as the answer (see ANY_OBJECT_SCHEMA). */
function checkToolCallLeak<T>(parsed: T): T {
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    (parsed as JsonObject).name === "functioncall" &&
    "arguments" in (parsed as JsonObject)
  ) {
    throw new ValidationError(
      "the model returned its internal tool call instead of an answer; this happens with " +
        'responseFormat { type: "json_object" } because the server applies no grammar to it. ' +
        "Pass a schema instead.",
    );
  }
  return parsed;
}

function parseChunk(line: string): string | undefined {
  try {
    const chunk = JSON.parse(line.replace(/^data: /, "")) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const content = chunk.choices?.[0]?.delta?.content;
    return content ?? undefined;
  } catch {
    return undefined;
  }
}

function* linesFromText(text: string): Generator<string> {
  for (const line of text.split("\n")) {
    if (line) yield line;
  }
}

async function* linesFromStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      if (line) yield line;
    }
  }
  if (buffer) yield buffer;
}

export async function* ask(
  client: DiffbotClient,
  messages: ChatMessage[],
  options: AskOptions = {},
): AsyncGenerator<string> {
  validateResponseFormat(options.responseFormat);
  const headers = { Authorization: `Bearer ${client.token}` };
  const payload: JsonObject = { model: MODEL, messages, stream: true };
  if (options.responseFormat !== undefined) payload.response_format = options.responseFormat;

  const response = await client.http.post(client.llmUrl, { headers, json: payload });
  if (!response.ok) {
    const body = await readBodyText(response);
    raiseForStatus(response, body);
    return;
  }

  if (response.body) {
    for await (const line of linesFromStream(response.body)) {
      const content = parseChunk(line);
      if (content) yield content;
    }
    return;
  }

  const text = await response.text();
  for (const line of linesFromText(text)) {
    const content = parseChunk(line);
    if (content) yield content;
  }
}

/**
 * Ask the Diffbot LLM and return the answer parsed as JSON. With `schema` (a JSON Schema
 * object) the model is constrained to it by grammar; without one it falls back to
 * unconstrained JSON output. Pass `responseFormat` instead of `schema` for full control.
 */
export async function askJson<T = unknown>(
  client: DiffbotClient,
  messages: ChatMessage[],
  schema?: JsonObject,
  options: AskOptions = {},
): Promise<T> {
  const responseFormat = resolveFormat(schema, options.responseFormat);
  let text = "";
  for await (const chunk of ask(client, messages, { responseFormat })) text += chunk;
  return checkToolCallLeak(extractJson(text)) as T;
}
