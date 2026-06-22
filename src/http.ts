import { APIError, AuthError, RateLimitError } from "./errors.js";

export type FetchFn = typeof fetch;

export interface HttpRequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  json?: unknown;
  redirect?: "follow" | "error" | "manual";
}

export class HttpClient {
  private closed = false;

  constructor(
    private readonly fetchFn: FetchFn,
    private readonly timeoutMs: number,
    readonly userAgent: string,
  ) {}

  async get(url: string, options: HttpRequestOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: "GET" });
  }

  async post(url: string, options: HttpRequestOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: "POST" });
  }

  async request(url: string, options: HttpRequestOptions & { method?: string } = {}): Promise<Response> {
    if (this.closed) {
      throw new Error("HTTP client is closed");
    }

    const parsed = new URL(url);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          parsed.searchParams.set(key, String(value));
        }
      }
    }

    const headers = new Headers(options.headers);
    headers.set("User-Agent", this.userAgent);
    if (options.json !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    const init: RequestInit = {
      method: options.method ?? "GET",
      headers,
      redirect: options.redirect,
      signal: AbortSignal.timeout(this.timeoutMs),
    };
    if (options.json !== undefined) {
      init.body = JSON.stringify(options.json);
    }

    return this.fetchFn(parsed.toString(), init);
  }

  async close(): Promise<void> {
    this.closed = true;
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
  if (status === 401 || status === 403) {
    throw new AuthError(status, body);
  }
  if (status === 429) {
    throw new RateLimitError(status, body, response.headers.get("retry-after"));
  }
  throw new APIError(status, body);
}

export async function readBodyText(response: Response): Promise<string> {
  return response.text();
}
