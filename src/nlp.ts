import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText } from "./decode.js";
import { ensureOk } from "./http.js";
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
  await ensureOk(response);
  const data = parseJsonText<JsonObject | JsonObject[]>(await readText(response));
  return Array.isArray(data) ? (data[0] ?? {}) : data;
}
