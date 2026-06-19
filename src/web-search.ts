import { readBodyText } from "./http.js";
import type { DiffbotClientLike, JsonObject } from "./types.js";

export async function webSearch(
  client: DiffbotClientLike,
  text: string,
  options: { numResults?: number; maxTokens?: number } = {},
): Promise<JsonObject> {
  const headers = { Authorization: `Bearer ${client.token}` };
  const params: Record<string, string | number> = { text };
  if (options.numResults !== undefined) params.size = options.numResults;
  if (options.maxTokens !== undefined) params.maxTokens = options.maxTokens;

  const response = await client.http.get(client.webSearchUrl, { headers, params });
  const body = await readBodyText(response);
  client.raiseForStatus(response, body);
  return JSON.parse(body) as JsonObject;
}
