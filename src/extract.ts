import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText } from "./decode.js";
import { ExtractionError } from "./errors.js";
import { ensureOk } from "./http.js";
import type {
  AnalyzeObject,
  ArticleObject,
  CustomApiObject,
  DiscussionObject,
  EventObject,
  ExtractResponse,
  ImageObject,
  JobObject,
  ListObject,
  ProductObject,
  VideoObject,
} from "./types/undocumented.js";

function buildParams(client: DiffbotClient, url: string, fmt: string) {
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

function parseResponse<T extends ExtractResponse>(data: T): T {
  if ("errorCode" in data) {
    throw new ExtractionError(Number(data.errorCode), String(data.error ?? ""));
  }
  return data;
}

function normalizeUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export async function extract(
  client: DiffbotClient,
  url: string,
  api?: "analyze",
  fmt?: string,
): Promise<ExtractResponse<AnalyzeObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "article",
  fmt?: string,
): Promise<ExtractResponse<ArticleObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "product",
  fmt?: string,
): Promise<ExtractResponse<ProductObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "discussion",
  fmt?: string,
): Promise<ExtractResponse<DiscussionObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "job",
  fmt?: string,
): Promise<ExtractResponse<JobObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "image",
  fmt?: string,
): Promise<ExtractResponse<ImageObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "video",
  fmt?: string,
): Promise<ExtractResponse<VideoObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "list",
  fmt?: string,
): Promise<ExtractResponse<ListObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "event",
  fmt?: string,
): Promise<ExtractResponse<EventObject>>;
/** A Custom API name (anything but the built-in `api` values above) returns an open object shape. */
export async function extract(
  client: DiffbotClient,
  url: string,
  api: string,
  fmt?: string,
): Promise<ExtractResponse<CustomApiObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api = "analyze",
  fmt = "markdown",
): Promise<ExtractResponse> {
  const normalized = normalizeUrl(url);
  const response = await client.http.get(`${client.analyzeUrl}/${api}`, {
    params: buildParams(client, normalized, fmt),
  });
  await ensureOk(response);
  return parseResponse(parseJsonText<ExtractResponse>(await readText(response)));
}
