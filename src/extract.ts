import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText, unsafeCast } from "./decode.js";
import { ExtractionError } from "./errors.js";
import type { operations } from "./generated/extract.js";
import { ensureOk } from "./http.js";
import type {
  AnalyzeObject,
  ArticleObject,
  DiscussionObject,
  EventObject,
  ExtractResponse,
  ImageObject,
  JobObject,
  ListObject,
  ProductObject,
  VideoObject,
} from "./types/undocumented.js";
import type { ExtraParams } from "./types/extra.js";

/** Default wire `timeout` (ms) when the caller does not set one. */
const DEFAULT_EXTRACT_TIMEOUT = 30_000;
/** Headroom the transport timeout keeps over the wire `timeout`, so the server answers first. */
const TRANSPORT_TIMEOUT_HEADROOM = 10_000;

type Query<K extends keyof operations> = operations[K]["parameters"]["query"];
type FieldOf<K extends keyof operations> = Query<K> extends { fields?: infer F } ? NonNullable<F> : never;
type ApiName = NonNullable<Query<"extract-analyze">["mode"]>;
type NaturalLanguageField = NonNullable<Query<"article">["naturalLanguage"]>;

/** Options every Extract API accepts. Names are the wire names. */
interface CommonOptions {
  /** Server-side extraction timeout in ms (wire `timeout`). Default 30000. The transport timeout is raised to at least this + 10s. */
  timeout?: number;
  /** Proxy selection (wire `useProxy`). `proxy`/`proxyAuth` go through `extra` only. */
  useProxy?: string;
}

type WithExtra<O> = O & {
  /** Wire query parameters not exposed as named options (e.g. `proxy`, `proxyAuth`). Named keys are rejected. */
  extra?: ExtraParams<"token" | "url" | (keyof O & string)>;
};

export type AnalyzeExtractOptions = WithExtra<
  CommonOptions & {
    /** Forces a specific API (or `"llm"`, which `fmt: "markdown"` already selects). Overrides `fmt`. */
    mode?: ApiName | "llm";
    fallback?: ApiName;
    fields?: readonly FieldOf<"extract-analyze">[];
    discussion?: boolean;
  }
>;
export type ArticleExtractOptions = WithExtra<
  CommonOptions & {
    fields?: readonly FieldOf<"article">[];
    paging?: boolean;
    maxTags?: number;
    tagConfidence?: number;
    categoryConfidence?: number;
    discussion?: boolean;
    naturalLanguage?: NaturalLanguageField | readonly NaturalLanguageField[];
    summaryNumSentences?: number;
  }
>;
export type ProductExtractOptions = WithExtra<
  CommonOptions & { fields?: readonly FieldOf<"product">[]; discussion?: boolean }
>;
export type DiscussionExtractOptions = WithExtra<
  CommonOptions & { fields?: readonly FieldOf<"discussion">[]; paging?: boolean; maxPages?: number | string }
>;
export type JobExtractOptions = WithExtra<CommonOptions & { fields?: readonly FieldOf<"job">[] }>;
export type ImageExtractOptions = WithExtra<CommonOptions & { fields?: readonly FieldOf<"image">[] }>;
export type VideoExtractOptions = WithExtra<CommonOptions & { fields?: readonly FieldOf<"video">[] }>;
export type ListExtractOptions = WithExtra<CommonOptions & { fields?: readonly FieldOf<"list">[] }>;
export type EventExtractOptions = WithExtra<CommonOptions & { fields?: readonly FieldOf<"event">[] }>;
/** Custom APIs: `fields` is open, since a Custom API can define its own. */
export type CustomExtractOptions = WithExtra<CommonOptions & { fields?: readonly string[] }>;

export type ExtractOptions =
  | AnalyzeExtractOptions
  | ArticleExtractOptions
  | ProductExtractOptions
  | DiscussionExtractOptions
  | JobExtractOptions
  | ImageExtractOptions
  | VideoExtractOptions
  | ListExtractOptions
  | EventExtractOptions
  | CustomExtractOptions;

type BuiltInApi = "analyze" | "article" | "product" | "discussion" | "job" | "image" | "video" | "list" | "event";
/** Excludes the built-in names, so a wrong option for `"product"` is an error instead of falling through to the open Custom API overload. */
type CustomApiName<A extends string> = A extends BuiltInApi ? never : A;

type WireValue = string | number | boolean | readonly string[] | undefined;

function buildParams(
  client: DiffbotClient,
  url: string,
  fmt: string,
  options: object,
): { params: Record<string, string | number>; wireTimeout: number } {
  const params: Record<string, string | number> = {
    token: client.token,
    url,
    timeout: DEFAULT_EXTRACT_TIMEOUT,
  };
  if (fmt === "markdown") {
    params.mode = "llm";
  }
  const { extra, ...named } = unsafeCast<{ extra?: Record<string, string> } & Record<string, WireValue>>(options);
  for (const [key, value] of Object.entries(named)) {
    if (value === undefined) continue;
    params[key] = Array.isArray(value) ? value.join(",") : typeof value === "boolean" ? String(value) : unsafeCast<string | number>(value);
  }
  if (extra) Object.assign(params, extra);
  return { params, wireTimeout: Number(params.timeout) };
}

function parseResponse<T extends ExtractResponse>(data: T): T {
  if ("errorCode" in data) {
    throw new ExtractionError(Number(data.errorCode), data.error ?? "");
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
  options?: AnalyzeExtractOptions,
): Promise<ExtractResponse<AnalyzeObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "article",
  fmt?: string,
  options?: ArticleExtractOptions,
): Promise<ExtractResponse<ArticleObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "product",
  fmt?: string,
  options?: ProductExtractOptions,
): Promise<ExtractResponse<ProductObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "discussion",
  fmt?: string,
  options?: DiscussionExtractOptions,
): Promise<ExtractResponse<DiscussionObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "job",
  fmt?: string,
  options?: JobExtractOptions,
): Promise<ExtractResponse<JobObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "image",
  fmt?: string,
  options?: ImageExtractOptions,
): Promise<ExtractResponse<ImageObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "video",
  fmt?: string,
  options?: VideoExtractOptions,
): Promise<ExtractResponse<VideoObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "list",
  fmt?: string,
  options?: ListExtractOptions,
): Promise<ExtractResponse<ListObject>>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api: "event",
  fmt?: string,
  options?: EventExtractOptions,
): Promise<ExtractResponse<EventObject>>;
/** A Custom API name (anything but the built-in `api` values above) returns an open object shape. */
export async function extract<A extends string>(
  client: DiffbotClient,
  url: string,
  api: CustomApiName<A>,
  fmt?: string,
  options?: CustomExtractOptions,
): Promise<ExtractResponse>;
export async function extract(
  client: DiffbotClient,
  url: string,
  api = "analyze",
  fmt = "markdown",
  options: ExtractOptions = {},
): Promise<ExtractResponse> {
  const normalized = normalizeUrl(url);
  const { params, wireTimeout } = buildParams(client, normalized, fmt, options);
  const response = await client.http.get(`${client.analyzeUrl}/${api}`, {
    params,
    // Never let the client abort before the server's own `timeout` can answer.
    timeout: Math.max(client.http.defaultTimeout, wireTimeout + TRANSPORT_TIMEOUT_HEADROOM),
  });
  await ensureOk(response);
  return parseResponse(parseJsonText<ExtractResponse>(await readText(response)));
}
