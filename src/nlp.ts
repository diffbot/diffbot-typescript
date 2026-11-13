import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText } from "./decode.js";
import { ensureOk } from "./http.js";
import type { NaturalLanguageResponse } from "./types/natural-language.js";

export type { NaturalLanguageResponse, NlpDocument, NlpField } from "./types/natural-language.js";

const NLP_FIELDS = "entities,sentiment";

/** Narrowed to the two fields `entities()` always requests; see `nlp()` (Phase 7) for the full surface. */
export type EntitiesResponse = Pick<NaturalLanguageResponse, "entities" | "sentiment">;

export async function entities(client: DiffbotClient, text: string, lang = "auto"): Promise<EntitiesResponse> {
  const params = { token: client.token, fields: NLP_FIELDS };
  const payload = [{ lang, format: "plain text", content: text }];
  const response = await client.http.post(client.nlpUrl, { params, json: payload });
  await ensureOk(response);
  const data = parseJsonText<EntitiesResponse | EntitiesResponse[]>(await readText(response));
  return Array.isArray(data) ? (data[0] ?? {}) : data;
}
