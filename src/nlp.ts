import { readBodyText } from "./http.js";
import type { DiffbotClientLike, JsonObject } from "./types.js";

const NLP_FIELDS = "entities,sentiment";

export async function entities(
  client: DiffbotClientLike,
  text: string,
  lang = "auto",
): Promise<JsonObject> {
  const params = { token: client.token, fields: NLP_FIELDS };
  const payload = [{ lang, format: "plain text", content: text }];
  const response = await client.http.post(client.nlpUrl, { params, json: payload });
  const body = await readBodyText(response);
  client.raiseForStatus(response, body);
  const data = JSON.parse(body) as JsonObject | JsonObject[];
  return Array.isArray(data) ? (data[0] ?? {}) : data;
}
