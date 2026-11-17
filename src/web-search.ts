import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText } from "./decode.js";
import { ValidationError } from "./errors.js";
import { ensureOk } from "./http.js";
import type { WebSearchResponse } from "./types/web-search.js";

export type { WebSearchResponse, WebSearchResult } from "./types/web-search.js";

/** How much of each page's matching content the web search returns in `content`. */
export type SnippetLength = "short" | "medium" | "long" | "full";

export const SNIPPET_LENGTHS: readonly SnippetLength[] = ["short", "medium", "long", "full"];

function isSnippetLength(value: string): value is SnippetLength {
  const lengths: readonly string[] = SNIPPET_LENGTHS;
  return lengths.includes(value);
}

export interface WebSearchOptions {
  numResults?: number;
  maxTokens?: number;
  /**
   * `short` keeps a result to ~1-1.5 KB; `long` is the API default; `full` returns the
   * whole stored page and is meant for `url:<URL>` queries. The reranker always chunks,
   * so `full` also sends `rerank=none` and query terms after the URL are ignored.
   */
  snippetLength?: SnippetLength;
}

/** The API accepts 1-5 `text` values per request. */
export const WEB_SEARCH_MAX_TEXTS = 5;

/**
 * `text` may be one query or 1-5 queries (sent as repeated `text=` params on the GET).
 * A single string is the default path. Any other count throws `ValidationError`.
 */
export async function webSearch(
  client: DiffbotClient,
  text: string | readonly string[],
  options: WebSearchOptions = {},
): Promise<WebSearchResponse> {
  const texts = typeof text === "string" ? [text] : text;
  if (texts.length < 1 || texts.length > WEB_SEARCH_MAX_TEXTS) {
    throw new ValidationError(`webSearch text must have 1-${WEB_SEARCH_MAX_TEXTS.toString()} values; got ${texts.length.toString()}`);
  }
  const headers = { Authorization: `Bearer ${client.token}` };
  const params: Record<string, string | number | readonly string[]> = {
    text: typeof text === "string" ? text : [...texts],
  };
  if (options.numResults !== undefined) params.size = options.numResults;
  if (options.maxTokens !== undefined) params.maxTokens = options.maxTokens;
  if (options.snippetLength !== undefined) {
    const length = options.snippetLength.toLowerCase();
    if (!isSnippetLength(length)) {
      throw new ValidationError(
        `snippetLength must be one of ${SNIPPET_LENGTHS.join(", ")}; got ${JSON.stringify(options.snippetLength)}`,
      );
    }
    params.snippetLength = length.toUpperCase();
    if (length === "full") params.rerank = "none";
  }

  const response = await client.http.get(client.webSearchUrl, { headers, params });
  await ensureOk(response);
  return parseJsonText<WebSearchResponse>(await readText(response));
}
