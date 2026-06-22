import type { DiffbotClient } from "./client.js";
import { readBodyText, raiseForStatus } from "./http.js";
import type { JsonObject } from "./json.js";

const NLP_FIELDS = "entities,sentiment";

export async function entities(
  client: DiffbotClient,
  text: string,
  lang = "auto",
): Promise<JsonObject> {
  const params = { token: client.token, fields: NLP_FIELDS };
  const payload = [{ lang, format: "plain text", content: text }];
  const response = await client.http.post(client.nlpUrl, { params, json: payload });
  const body = await readBodyText(response);
  raiseForStatus(response, body);
  const data = JSON.parse(body) as JsonObject | JsonObject[];
  return Array.isArray(data) ? (data[0] ?? {}) : data;
}
