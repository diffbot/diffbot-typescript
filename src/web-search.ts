import type { DiffbotClient } from "./client.js";
import { readBodyText, raiseForStatus } from "./http.js";
import type { JsonObject } from "./json.js";

export async function webSearch(
  client: DiffbotClient,
  text: string,
  options: { numResults?: number; maxTokens?: number } = {},
): Promise<JsonObject> {
  const headers = { Authorization: `Bearer ${client.token}` };
  const params: Record<string, string | number> = { text };
  if (options.numResults !== undefined) params.size = options.numResults;
  if (options.maxTokens !== undefined) params.maxTokens = options.maxTokens;

  const response = await client.http.get(client.webSearchUrl, { headers, params });
  const body = await readBodyText(response);
  raiseForStatus(response, body);
  return JSON.parse(body) as JsonObject;
}
