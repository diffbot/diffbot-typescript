import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText, unsafeCast } from "./decode.js";
import { ValidationError } from "./errors.js";
import { ensureOk } from "./http.js";
import type { NaturalLanguageResponse, NlpDocument, NlpField } from "./types/natural-language.js";

export type { NaturalLanguageResponse, NlpDocument, NlpField } from "./types/natural-language.js";

const NLP_FIELDS = "entities,sentiment";

/** Narrowed to the two fields `entities()` always requests. */
export type EntitiesResponse = Pick<NaturalLanguageResponse, "entities" | "sentiment">;

export async function entities(client: DiffbotClient, text: string, lang = "auto"): Promise<EntitiesResponse> {
  const params = { token: client.token, fields: NLP_FIELDS };
  const payload = [{ lang, format: "plain text", content: text }];
  const response = await client.http.post(client.nlpUrl, { params, json: payload });
  await ensureOk(response);
  const data = parseJsonText<EntitiesResponse | EntitiesResponse[]>(await readText(response));
  return Array.isArray(data) ? (data[0] ?? {}) : data;
}

export interface NlpOptions<F extends NlpField = NlpField> {
  /** Which analyses to run (wire `fields`, comma-joined). At least one. */
  fields: readonly F[];
  /** ISO 639-1 code, or `"auto"` (default). */
  lang?: string;
  /** `"plain text with title"` treats the first line as the title. Default `"plain text"`. */
  format?: NlpDocument["format"];
  documentType?: NonNullable<NlpDocument["documentType"]>;
  /** Used with `fields: ["summary"]`. */
  customSummary?: { maxNumberOfSentences: number };
}

/** The response narrowed to the requested fields. */
export type NlpResponse<F extends NlpField> = Pick<NaturalLanguageResponse, F>;

/**
 * Full-fidelity call on the NL endpoint for a single document. `entities()` is the
 * fixed `entities,sentiment` shortcut; multi-document batches are not supported.
 */
export async function nlp<const F extends NlpField>(
  client: DiffbotClient,
  text: string,
  options: NlpOptions<F>,
): Promise<NlpResponse<F>> {
  if (!options.fields.length) throw new ValidationError("nlp(): fields must name at least one field");
  const params = { token: client.token, fields: options.fields.join(",") };
  const document: Record<string, unknown> = {
    lang: options.lang ?? "auto",
    format: options.format ?? "plain text",
    content: text,
  };
  if (options.documentType !== undefined) document.documentType = options.documentType;
  if (options.customSummary !== undefined) document.customSummary = options.customSummary;
  const response = await client.http.post(client.nlpUrl, { params, json: [document] });
  await ensureOk(response);
  const data = parseJsonText<NlpResponse<F> | NlpResponse<F>[]>(await readText(response));
  // Every response field is optional, so `{}` is a valid (empty) result.
  return Array.isArray(data) ? (data[0] ?? unsafeCast<NlpResponse<F>>({})) : data;
}
