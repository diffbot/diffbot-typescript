import { ExtractionError } from "./errors.js";
import { raiseForStatus, readBodyText } from "./http.js";
import type { DiffbotClientLike, JsonObject } from "./types.js";

function buildParams(client: DiffbotClientLike, url: string, fmt: string) {
  const params: Record<string, string | number> = {
    token: client.token,
    url,
    timeout: 30_000,
  };
  if (fmt === "markdown") {
    params.mode = "llm";
  }
  return params;
}

function parseResponse(data: JsonObject): JsonObject {
  if ("errorCode" in data) {
    throw new ExtractionError(
      Number(data.errorCode),
      String(data.error ?? ""),
    );
  }
  return data;
}

function normalizeUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export async function extract(
  client: DiffbotClientLike,
  url: string,
  api = "analyze",
  fmt = "markdown",
): Promise<JsonObject> {
  const normalized = normalizeUrl(url);
  const response = await client.http.get(`${client.analyzeUrl}/${api}`, {
    params: buildParams(client, normalized, fmt),
  });
  const body = await readBodyText(response);
  client.raiseForStatus(response, body);
  return parseResponse(JSON.parse(body) as JsonObject);
}
