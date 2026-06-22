import type { FetchFn } from "../../src/http.js";

export interface MockRequest {
  url: string;
  method: string;
  headers: Headers;
  params: URLSearchParams;
  body?: string;
}

export type MockHandler = (request: MockRequest) => Response | Promise<Response>;

function toTextBody(body: RequestInit["body"]): string | undefined {
  if (body == null) return undefined;
  if (typeof body === "string") return body;
  return undefined;
}

export function createMockFetch(handler: MockHandler): FetchFn {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const parsed = new URL(url);
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers);
    const body = toTextBody(init?.body ?? null);

    return handler({
      url: `${parsed.origin}${parsed.pathname}`,
      method,
      headers,
      params: parsed.searchParams,
      body,
    });
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function sseResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/event-stream" },
  });
}
