import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText } from "./decode.js";
import { JobError } from "./errors.js";
import { ensureOk } from "./http.js";
import type { JsonObject } from "./json.js";

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
  customHeaders?: string;
  watch?: boolean;
  pollInterval?: number;
}

function buildCrawlParams(
  client: DiffbotClient,
  jobName: string,
  site: string,
  options: Required<Pick<CrawlOptions, "maxToCrawl" | "maxToProcess" | "hops" | "restrictDomain" | "apiUrl" | "crawlDelay" | "obeyRobots" | "useProxies">> &
    Pick<CrawlOptions, "urlCrawlPattern" | "urlProcessPattern" | "customHeaders">,
) {
  const params: Record<string, string | number> = {
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
  if (options.customHeaders) params.customHeaders = options.customHeaders;
  return params;
}

/** Splits one CSV line into fields, honoring double-quoted fields with embedded
 * commas and `""`-escaped quotes. Does not span quoted newlines across lines. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
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
  const lines = text.trim().split("\n");
  if (lines.length < 2) return events;

  const headers = parseCsvLine(lines[0]!).map((h) => h.trim());
  const urlIdx = headers.indexOf("Url");
  const timeIdx = headers.indexOf("Crawled Time");
  const statusIdx = headers.indexOf("Crawl Status");

  for (const line of lines.slice(1)) {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* crawl(
  client: DiffbotClient,
  site: string,
  options: CrawlOptions = {},
): AsyncGenerator<CrawlEvent> {
  let normalizedSite = site.startsWith("http") ? site : `https://${site}`;
  const jobName = options.jobName ?? `crawl-${Math.floor(Date.now() / 1000)}`;

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
  });

  const response = await client.http.get(client.crawlerUrl, { params });
  await ensureOk(response);

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

  while (true) {
    const statusResponse = await client.http.get(client.crawlerUrl, {
      params: { token: client.token, name: jobName },
    });
    await ensureOk(statusResponse);
    const jobs = parseJsonText<JsonObject>(await readText(statusResponse)).jobs as
      | JsonObject[]
      | undefined;
    if (!jobs?.length) break;

    const jobStatus = (jobs[0]!.jobStatus ?? {}) as JsonObject;
    const statusCode = Number(jobStatus.status ?? 0);

    const urlsResponse = await client.http.get(`${client.crawlerUrl}/data`, {
      params: { token: client.token, name: jobName, type: "urls" },
      redirect: "follow",
    });
    await ensureOk(urlsResponse);
    const urlsBody = await readText(urlsResponse);
    if (urlsBody) {
      for (const event of parseUrlCsv(urlsBody, seenUrls)) {
        yield event;
      }
    }

    if (statusCode !== 0 && statusCode !== 7) {
      const message = String(jobStatus.message ?? "");
      if (/fail|error/i.test(message)) {
        throw new JobError(jobName, `Crawler job failed: ${message}`);
      }
      break;
    }

    await sleep(pollInterval);
  }
}

export async function crawlListJobs(client: DiffbotClient): Promise<JsonObject[]> {
  const response = await client.http.get(client.crawlerUrl, {
    params: { token: client.token },
  });
  await ensureOk(response);
  return (parseJsonText<JsonObject>(await readText(response)).jobs as JsonObject[] | undefined) ?? [];
}

export async function crawlGetJob(client: DiffbotClient, jobName: string): Promise<JsonObject> {
  const response = await client.http.get(client.crawlerUrl, {
    params: { token: client.token, name: jobName },
  });
  await ensureOk(response);
  const jobs = parseJsonText<JsonObject>(await readText(response)).jobs as JsonObject[] | undefined;
  return jobs?.[0] ?? {};
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
