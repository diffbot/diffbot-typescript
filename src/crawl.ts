import type { DiffbotClient } from "./client.js";
import { headersToRecord, parseJsonText, readText } from "./decode.js";
import { APIError, JobError } from "./errors.js";
import { ensureOk } from "./http.js";
import type { JsonObject } from "./json.js";
import type { CrawlDataRecord, CrawlJob } from "./types/undocumented.js";

interface CrawlListResponse extends JsonObject {
  jobs?: CrawlJob[];
}

export enum CrawlEventType {
  JobCreated = "job_created",
  UrlProcessed = "url_processed",
}

export interface CrawlEvent {
  eventType: CrawlEventType;
  timestamp: string;
  details: JsonObject;
}

export interface CrawlOptions {
  hops?: number;
  jobName?: string;
  maxToCrawl?: number;
  maxToProcess?: number;
  restrictDomain?: boolean;
  apiUrl?: string;
  crawlDelay?: number;
  urlCrawlPattern?: string;
  urlProcessPattern?: string;
  obeyRobots?: boolean;
  useProxies?: boolean;
  /** One `Name:value` header, or several; each is sent as its own repeated `customHeaders` param. */
  customHeaders?: string | readonly string[];
  /** Regex counterpart of `urlCrawlPattern`. */
  urlCrawlRegEx?: string;
  /** Regex counterpart of `urlProcessPattern`. */
  urlProcessRegEx?: string;
  /** Only pages whose HTML contains this string are processed. */
  pageProcessPattern?: string;
  maxToCrawlPerSubdomain?: number;
  maxToProcessPerSubdomain?: number;
  /** `false` sends `useCanonical=0` (disables canonical-link deduplication). Server default is on. */
  useCanonical?: boolean;
  notifyWebhook?: string;
  notifyEmail?: string;
  watch?: boolean;
  pollInterval?: number;
}

function buildCrawlParams(
  client: DiffbotClient,
  jobName: string,
  site: string,
  options: Required<Pick<CrawlOptions, "maxToCrawl" | "maxToProcess" | "hops" | "restrictDomain" | "apiUrl" | "crawlDelay" | "obeyRobots" | "useProxies">> &
    Pick<
      CrawlOptions,
      | "urlCrawlPattern"
      | "urlProcessPattern"
      | "customHeaders"
      | "urlCrawlRegEx"
      | "urlProcessRegEx"
      | "pageProcessPattern"
      | "maxToCrawlPerSubdomain"
      | "maxToProcessPerSubdomain"
      | "useCanonical"
      | "notifyWebhook"
      | "notifyEmail"
    >,
) {
  const params: Record<string, string | number | readonly string[]> = {
    token: client.token,
    name: jobName,
    seeds: site,
    maxToCrawl: options.maxToCrawl,
    maxToProcess: options.maxToProcess,
    maxHops: options.hops,
    restrictDomain: options.restrictDomain ? 1 : 0,
  };
  if (options.apiUrl) params.apiUrl = options.apiUrl;
  if (options.crawlDelay > 0) params.crawlDelay = options.crawlDelay;
  if (options.urlCrawlPattern) params.urlCrawlPattern = options.urlCrawlPattern;
  if (options.urlProcessPattern) params.urlProcessPattern = options.urlProcessPattern;
  if (options.obeyRobots) params.obeyRobots = 1;
  if (options.useProxies) params.useProxies = 1;
  if (options.urlCrawlRegEx) params.urlCrawlRegEx = options.urlCrawlRegEx;
  if (options.urlProcessRegEx) params.urlProcessRegEx = options.urlProcessRegEx;
  if (options.pageProcessPattern) params.pageProcessPattern = options.pageProcessPattern;
  if (options.maxToCrawlPerSubdomain !== undefined) params.maxToCrawlPerSubdomain = options.maxToCrawlPerSubdomain;
  if (options.maxToProcessPerSubdomain !== undefined) {
    params.maxToProcessPerSubdomain = options.maxToProcessPerSubdomain;
  }
  if (options.useCanonical !== undefined) params.useCanonical = options.useCanonical ? 1 : 0;
  if (options.notifyWebhook) params.notifyWebhook = options.notifyWebhook;
  if (options.notifyEmail) params.notifyEmail = options.notifyEmail;
  if (typeof options.customHeaders === "string") {
    if (options.customHeaders) params.customHeaders = options.customHeaders;
  } else if (options.customHeaders?.length) {
    params.customHeaders = options.customHeaders;
  }
  return params;
}

/** Splits one CSV line into fields, honoring double-quoted fields with embedded
 * commas and `""`-escaped quotes. Does not span quoted newlines across lines. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === undefined) break;
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

function parseUrlCsv(text: string, seenUrls: Set<string>): CrawlEvent[] {
  const events: CrawlEvent[] = [];
  const [headerLine, ...dataLines] = text.trim().split("\n");
  if (headerLine === undefined || dataLines.length === 0) return events;

  const headers = parseCsvLine(headerLine).map((h) => h.trim());
  const urlIdx = headers.indexOf("Url");
  const timeIdx = headers.indexOf("Crawled Time");
  const statusIdx = headers.indexOf("Crawl Status");

  for (const line of dataLines) {
    if (!line) continue;
    const cols = parseCsvLine(line);
    const url = cols[urlIdx]?.trim() ?? "";
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      events.push({
        eventType: CrawlEventType.UrlProcessed,
        timestamp: cols[timeIdx]?.trim() ?? new Date().toISOString(),
        details: {
          url,
          status: cols[statusIdx]?.trim() ?? "unknown",
        },
      });
    }
  }
  return events;
}

/** `errorCode` from a crawl-create body, or `undefined` for success or a non-JSON body. */
function createErrorCode(body: string): unknown {
  try {
    return parseJsonText(body).errorCode;
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* crawl(
  client: DiffbotClient,
  site: string,
  options: CrawlOptions = {},
): AsyncGenerator<CrawlEvent> {
  const normalizedSite = site.startsWith("http") ? site : `https://${site}`;
  const jobName = options.jobName ?? `crawl-${Math.floor(Date.now() / 1000).toString()}`;

  const params = buildCrawlParams(client, jobName, normalizedSite, {
    hops: options.hops ?? 2,
    maxToCrawl: options.maxToCrawl ?? 100,
    maxToProcess: options.maxToProcess ?? 100,
    restrictDomain: options.restrictDomain ?? true,
    apiUrl: options.apiUrl ?? "",
    crawlDelay: options.crawlDelay ?? -1,
    urlCrawlPattern: options.urlCrawlPattern,
    urlProcessPattern: options.urlProcessPattern,
    obeyRobots: options.obeyRobots ?? false,
    useProxies: options.useProxies ?? false,
    customHeaders: options.customHeaders,
    urlCrawlRegEx: options.urlCrawlRegEx,
    urlProcessRegEx: options.urlProcessRegEx,
    pageProcessPattern: options.pageProcessPattern,
    maxToCrawlPerSubdomain: options.maxToCrawlPerSubdomain,
    maxToProcessPerSubdomain: options.maxToProcessPerSubdomain,
    useCanonical: options.useCanonical,
    notifyWebhook: options.notifyWebhook,
    notifyEmail: options.notifyEmail,
  });

  const response = await client.http.get(client.crawlerUrl, { params });
  await ensureOk(response);
  // Some create failures (e.g. a job name over 30 characters, errorCode 505) arrive as
  // HTTP 200 with `{ errorCode, error }` and create nothing; surface them here instead of
  // reporting JobCreated and then watching a job that does not exist.
  const createBody = await readText(response);
  if (createErrorCode(createBody) !== undefined) {
    throw new APIError(response.status, createBody, headersToRecord(response.headers));
  }

  yield {
    eventType: CrawlEventType.JobCreated,
    timestamp: new Date().toISOString(),
    details: { job_name: jobName },
  };

  if (!options.watch) {
    return;
  }

  const seenUrls = new Set<string>();
  const pollInterval = options.pollInterval ?? 2000;

  for (;;) {
    const statusResponse = await client.http.get(client.crawlerUrl, {
      params: { token: client.token, name: jobName },
    });
    await ensureOk(statusResponse);
    const jobs = parseJsonText<CrawlListResponse>(await readText(statusResponse)).jobs;
    const job = jobs?.[0];
    if (!job) break;

    const jobStatus = job.jobStatus ?? {};
    const statusCode = jobStatus.status ?? 0;

    const urlsBody = await crawlDownload(client, jobName, { type: "urls" });
    if (urlsBody) {
      for (const event of parseUrlCsv(urlsBody, seenUrls)) {
        yield event;
      }
    }

    if (statusCode !== 0 && statusCode !== 7) {
      const message = jobStatus.message ?? "";
      if (/fail|error/i.test(message)) {
        throw new JobError(jobName, `Crawler job failed: ${message}`);
      }
      break;
    }

    await sleep(pollInterval);
  }
}

export async function crawlListJobs(client: DiffbotClient): Promise<CrawlJob[]> {
  const response = await client.http.get(client.crawlerUrl, {
    params: { token: client.token },
  });
  await ensureOk(response);
  return parseJsonText<CrawlListResponse>(await readText(response)).jobs ?? [];
}

export interface CrawlDownloadOptions {
  /** `"csv"` returns the raw CSV text (top-level fields only). Default `"json"`. */
  format?: "json" | "csv";
  /** e.g. `"urls"` for the URL report. That report is always CSV text, whatever `format` says. */
  type?: string;
  /** Only the N most recently processed URLs. */
  num?: number;
}

/** CSV text when `format: "csv"` or `type: "urls"`; otherwise parsed records. */
export type CrawlDownloadResult<O extends CrawlDownloadOptions> = O extends { format: "csv" }
  ? string
  : O extends { type: "urls" }
    ? string
    : CrawlDataRecord[];

/**
 * `GET /v3/crawl/data`: download a crawl job's extracted data. For tools that cannot sit in
 * a watch loop, the recommended pattern is `crawl(..., { watch: false })`, poll
 * `crawlGetJob` until its `jobStatus` is terminal, then `crawlDownload`.
 */
export async function crawlDownload<const O extends CrawlDownloadOptions = Record<string, never>>(
  client: DiffbotClient,
  jobName: string,
  options?: O,
): Promise<CrawlDownloadResult<O>>;
export async function crawlDownload(
  client: DiffbotClient,
  jobName: string,
  options: CrawlDownloadOptions = {},
): Promise<string | CrawlDataRecord[]> {
  const params: Record<string, string | number> = { token: client.token, name: jobName };
  if (options.format === "csv") params.format = "csv";
  if (options.type !== undefined) params.type = options.type;
  if (options.num !== undefined) params.num = options.num;
  const response = await client.http.get(`${client.crawlerUrl}/data`, { params, redirect: "follow" });
  await ensureOk(response);
  const body = await readText(response);
  if (options.format === "csv" || options.type === "urls") return body;
  if (!body.trim()) return [];
  const data = parseJsonText<CrawlDataRecord[] | { errorCode?: number; error?: string }>(body);
  if (!Array.isArray(data)) {
    throw new JobError(jobName, `Crawl data download failed: ${data.error ?? "unexpected response"}`);
  }
  return data;
}

/** `undefined` when no job with this name exists (previously an indistinguishable `{}`). */
export async function crawlGetJob(client: DiffbotClient, jobName: string): Promise<CrawlJob | undefined> {
  const response = await client.http.get(client.crawlerUrl, {
    params: { token: client.token, name: jobName },
  });
  await ensureOk(response);
  const jobs = parseJsonText<CrawlListResponse>(await readText(response)).jobs;
  return jobs?.[0];
}

export async function crawlDeleteJob(client: DiffbotClient, jobName: string): Promise<void> {
  // A GET-shaped mutation: retrying it could issue a second delete against a job that
  // no longer exists, so it must not be retried like an ordinary idempotent GET.
  const response = await client.http.get(client.crawlerUrl, {
    params: { token: client.token, name: jobName, delete: 1 },
    retryable: false,
  });
  await ensureOk(response);
}
