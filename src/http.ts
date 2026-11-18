import { headersToRecord } from "./decode.js";
import { APIError, AuthError, NotFoundError, RateLimitError } from "./errors.js";

export type FetchFn = typeof fetch;

export type QueryParamValue = string | number | boolean;
export type QueryParams = Record<string, QueryParamValue | readonly QueryParamValue[] | undefined>;

/**
 * Retry policy for transient failures (429, 5xx, connection errors). `maxAttempts`
 * counts the initial try, so `3` means up to 2 retries. Disable per client with
 * `retry: false` on `DiffbotClientOptions`; disable per call with `retryable: false`
 * on a handler's options — required for GET-shaped mutations (e.g. `crawl?delete=1`)
 * that must never be retried blindly.
 *
 * `maxDelayMs` caps the exponential backoff and is also the ceiling for a server's
 * `Retry-After`: if a 429/5xx asks for a longer wait (seconds or HTTP-date form), the
 * SDK does not sleep or retry and returns that response at once, so the caller gets
 * `RateLimitError` (or `APIError` for a 5xx) with the header intact
 * (`RateLimitError.retryAfter`, `APIError.headers["retry-after"]`).
 */
export interface RetryPolicy {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

interface ResolvedRetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
}

export const DEFAULT_RETRY_POLICY: Required<RetryPolicy> = {
  maxAttempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 5_000,
  jitter: true,
};

function resolveRetryPolicy(policy: RetryPolicy): ResolvedRetryPolicy {
  return {
    maxAttempts: policy.maxAttempts ?? DEFAULT_RETRY_POLICY.maxAttempts,
    baseDelayMs: policy.baseDelayMs ?? DEFAULT_RETRY_POLICY.baseDelayMs,
    maxDelayMs: policy.maxDelayMs ?? DEFAULT_RETRY_POLICY.maxDelayMs,
    jitter: policy.jitter ?? DEFAULT_RETRY_POLICY.jitter,
  };
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Parses `Retry-After` as seconds or an HTTP date into a non-negative delay (ms). */
function parseRetryAfterMs(retryAfter: string | null): number | undefined {
  if (!retryAfter) return undefined;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }
  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return undefined;
}

/**
 * Delay before the next attempt: a parseable `Retry-After` is honored as given,
 * otherwise exponential backoff capped at `maxDelayMs`. Returns `null` when
 * `Retry-After` exceeds `maxDelayMs`, meaning "do not retry; surface the response".
 */
function computeDelayMs(attempt: number, retryAfter: string | null, policy: ResolvedRetryPolicy): number | null {
  const retryAfterMs = parseRetryAfterMs(retryAfter);
  if (retryAfterMs !== undefined) {
    return retryAfterMs > policy.maxDelayMs ? null : retryAfterMs;
  }
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempt - 1));
  return policy.jitter ? exponential * (0.5 + Math.random() * 0.5) : exponential;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface HttpRequestOptions {
  params?: QueryParams;
  headers?: Record<string, string>;
  json?: unknown;
  /** Raw request body (string, Uint8Array, URLSearchParams, Blob, FormData, ...). Ignored if `json` is set. */
  body?: RequestInit["body"];
  /** Overrides the inferred `Content-Type`. */
  contentType?: string;
  redirect?: "follow" | "error" | "manual";
  /** Overrides the client's default timeout for this call only. */
  timeout?: number;
  /** Set `false` to opt a call out of retries, e.g. a GET-shaped mutation. Default `true`. */
  retryable?: boolean;
}

function buildUrl(url: string, params?: QueryParams): URL {
  const parsed = new URL(url);
  if (!params) return parsed;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        parsed.searchParams.append(key, String(item));
      }
    } else {
      parsed.searchParams.append(key, String(value));
    }
  }
  return parsed;
}

function resolveContentType(options: HttpRequestOptions, headers: Headers): string | undefined {
  if (options.contentType) return options.contentType;
  if (headers.has("content-type")) return undefined;
  if (options.json !== undefined) return "application/json";
  if (options.body instanceof URLSearchParams) return "application/x-www-form-urlencoded;charset=UTF-8";
  return undefined;
}

export class HttpClient {
  private closed = false;
  private readonly retryPolicy: ResolvedRetryPolicy | null;

  constructor(
    private readonly fetchFn: FetchFn,
    private readonly timeoutMs: number,
    readonly userAgent: string,
    retry: RetryPolicy | false = {},
  ) {
    this.retryPolicy = retry === false ? null : resolveRetryPolicy(retry);
  }

  /** The client-level request timeout (ms), used when a call does not set its own. */
  get defaultTimeout(): number {
    return this.timeoutMs;
  }

  async get(url: string, options: HttpRequestOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: "GET" });
  }

  async post(url: string, options: HttpRequestOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: "POST" });
  }

  async delete(url: string, options: HttpRequestOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: "DELETE" });
  }

  async request(url: string, options: HttpRequestOptions & { method?: string } = {}): Promise<Response> {
    if (this.closed) {
      throw new Error("HTTP client is closed");
    }

    const parsed = buildUrl(url, options.params);
    const headers = new Headers(options.headers);
    headers.set("User-Agent", this.userAgent);
    const contentType = resolveContentType(options, headers);
    if (contentType) headers.set("Content-Type", contentType);

    const init: RequestInit = {
      method: options.method ?? "GET",
      headers,
      redirect: options.redirect,
    };
    if (options.json !== undefined) {
      init.body = JSON.stringify(options.json);
    } else if (options.body !== undefined) {
      init.body = options.body;
    }

    const timeoutMs = options.timeout ?? this.timeoutMs;
    const retryable = options.retryable ?? true;
    const policy = retryable ? this.retryPolicy : null;
    const maxAttempts = policy ? policy.maxAttempts : 1;

    for (let attempt = 1; ; attempt++) {
      let response: Response;
      try {
        response = await this.fetchFn(parsed.toString(), {
          ...init,
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        if (policy && attempt < maxAttempts) {
          await sleep(computeDelayMs(attempt, null, policy) ?? 0);
          continue;
        }
        throw error;
      }

      if (policy && attempt < maxAttempts && isRetryableStatus(response.status)) {
        const delayMs = computeDelayMs(attempt, response.headers.get("retry-after"), policy);
        // Retry-After beyond maxDelayMs: don't sleep or retry; the caller raises
        // RateLimitError/APIError from this response with the header intact.
        if (delayMs === null) return response;
        // Release the discarded attempt's connection; an unread body pins it in undici.
        await response.body?.cancel().catch(() => undefined);
        await sleep(delayMs);
        continue;
      }

      return response;
    }
  }

  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }

  get isClosed(): boolean {
    return this.closed;
  }
}

export function raiseForStatus(response: Response, bodyText?: string): void {
  if (response.ok) {
    return;
  }
  const status = response.status;
  const body = bodyText ?? "";
  const headers = headersToRecord(response.headers);
  if (status === 401 || status === 403) {
    throw new AuthError(status, body, headers);
  }
  if (status === 404) {
    throw new NotFoundError(status, body, headers);
  }
  if (status === 429) {
    throw new RateLimitError(status, body, response.headers.get("retry-after"), headers);
  }
  throw new APIError(status, body, headers);
}

/** Reads the body as text and raises when the response is not ok; a no-op on success. */
export async function ensureOk(response: Response): Promise<void> {
  if (response.ok) return;
  const body = await response.text();
  raiseForStatus(response, body);
}
