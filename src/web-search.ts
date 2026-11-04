import type { DiffbotClient } from "./client.js";
import { ValidationError } from "./errors.js";
import { readBodyText, raiseForStatus } from "./http.js";
import type { JsonObject } from "./json.js";

/** How much of each page's matching content the web search returns in `content`. */
export type SnippetLength = "short" | "medium" | "long" | "full";

export const SNIPPET_LENGTHS: readonly SnippetLength[] = ["short", "medium", "long", "full"];

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

export async function webSearch(
  client: DiffbotClient,
  text: string,
  options: WebSearchOptions = {},
): Promise<JsonObject> {
  const headers = { Authorization: `Bearer ${client.token}` };
  const params: Record<string, string | number> = { text };
  if (options.numResults !== undefined) params.size = options.numResults;
  if (options.maxTokens !== undefined) params.maxTokens = options.maxTokens;
  if (options.snippetLength !== undefined) {
    const length = options.snippetLength.toLowerCase() as SnippetLength;
    if (!SNIPPET_LENGTHS.includes(length)) {
      throw new ValidationError(
        `snippetLength must be one of ${SNIPPET_LENGTHS.join(", ")}; got ${JSON.stringify(options.snippetLength)}`,
      );
    }
    params.snippetLength = length.toUpperCase();
    if (length === "full") params.rerank = "none";
  }

  const response = await client.http.get(client.webSearchUrl, { headers, params });
  const body = await readBodyText(response);
  raiseForStatus(response, body);
  return JSON.parse(body) as JsonObject;
}
