/**
 * The one place in the core package allowed to use `as` / unsafe JSON parsing.
 * Every other module reads response bodies through these functions instead of
 * calling `JSON.parse` or casting directly, so a lint rule can enforce that split.
 */
import type { JsonObject } from "./json.js";

export function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

/**
 * Best-effort extraction of `{message, requestId}` from an API error body. Never throws.
 * Falls back to `error` for the `{ errorCode, error }` shape several Diffbot APIs use.
 */
export function tryParseErrorBody(body: string): { message?: string; requestId?: string } {
  try {
    const data = JSON.parse(body) as { message?: unknown; error?: unknown; requestId?: unknown };
    return {
      message:
        typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : undefined,
      requestId: typeof data.requestId === "string" ? data.requestId : undefined,
    };
  } catch {
    return {};
  }
}

export async function readText(response: Response): Promise<string> {
  return response.text();
}

export async function readBytes(response: Response): Promise<Uint8Array> {
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters --
   T appears only in the return position by design: these are type-assertion
   helpers, not narrowing generics, so a caller supplying T is the whole point. */

/** Parse already-read text as JSON. The sole sanctioned `as` for response payloads. */
export function parseJsonText<T = JsonObject>(text: string): T {
  return JSON.parse(text) as T;
}

export async function readJson<T = JsonObject>(response: Response): Promise<T> {
  return parseJsonText<T>(await response.text());
}

/**
 * The one sanctioned `as` for the whole package (lint-enforced): every other module
 * that needs to assert a type it cannot prove — a runtime environment's shape, an
 * unchecked `askJson<T>()` fallback — calls this instead of writing `as` directly, so
 * every unprovable assertion in the codebase is findable from one place.
 */
export function unsafeCast<T>(value: unknown): T {
  return value as T;
}
/* eslint-enable @typescript-eslint/no-unnecessary-type-parameters */

/**
 * Line-delimited JSON (`format=jsonl`), streamed when the runtime exposes a readable
 * body and falling back to a single read + split otherwise (e.g. in test mocks).
 */
export async function* readNdjson<T = unknown>(response: Response): AsyncGenerator<T> {
  if (!response.body) {
    const text = await response.text();
    for (const line of text.split("\n")) {
      if (line.trim()) yield parseJsonText<T>(line);
    }
    return;
  }

  const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      if (line.trim()) yield parseJsonText<T>(line);
    }
  }
  if (buffer.trim()) yield parseJsonText<T>(buffer);
}
