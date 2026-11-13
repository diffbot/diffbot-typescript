/** Hand-written facade over `src/generated/web-search.ts`. */
import type { operations } from "../generated/web-search.js";
import type { JsonObject } from "../json.js";

export type WebSearchResponse = operations["get_"]["responses"][200]["content"]["application/json"];
export type WebSearchResult = NonNullable<WebSearchResponse["search_results"]>[number];

type _WebSearchResponseIsJsonObject = WebSearchResponse extends JsonObject ? true : never;
const _webSearchResponseIsJsonObject: _WebSearchResponseIsJsonObject = true;
void _webSearchResponseIsJsonObject;
