import { afterEach, describe, expect, it, vi } from "vitest";
import { APIError, NotFoundError, RateLimitError } from "../src/errors.js";
import { ensureOk, HttpClient, raiseForStatus, type FetchFn } from "../src/http.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

describe("HttpClient repeated params", () => {
  it("appends array-valued params instead of overwriting", async () => {
    const fetchFn = createMockFetch((req) => {
      expect(req.params.getAll("tag")).toEqual(["a", "b", "c"]);
      return jsonResponse({});
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", false);
    await client.get("https://example.com/x", { params: { tag: ["a", "b", "c"] } });
  });
});

describe("HttpClient DELETE, raw and form bodies", () => {
  it("issues a DELETE with a JSON body", async () => {
    const fetchFn = createMockFetch((req) => {
      expect(req.method).toBe("DELETE");
      expect(req.headers.get("content-type")).toBe("application/json");
      expect(req.body).toBe(JSON.stringify({ api: "x" }));
      return jsonResponse({});
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", false);
    await client.delete("https://example.com/custom", { json: { api: "x" } });
  });

  it("form-encodes a URLSearchParams body and sets Content-Type", async () => {
    const fetchFn = createMockFetch((req) => {
      expect(req.headers.get("content-type")).toContain("application/x-www-form-urlencoded");
      expect(req.body).toBe("a=1&b=2");
      return jsonResponse({});
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", false);
    await client.post("https://example.com/x", { body: new URLSearchParams({ a: "1", b: "2" }) });
  });

  it("lets a caller override the inferred Content-Type and send a raw body", async () => {
    const fetchFn = createMockFetch((req) => {
      expect(req.headers.get("content-type")).toBe("text/html");
      expect(req.body).toBe("<html></html>");
      return jsonResponse({});
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", false);
    await client.post("https://example.com/x", { body: "<html></html>", contentType: "text/html" });
  });

  it("respects a Content-Type already present in headers", async () => {
    const fetchFn = createMockFetch((req) => {
      expect(req.headers.get("content-type")).toBe("application/pdf");
      return jsonResponse({});
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", false);
    await client.post("https://example.com/x", {
      body: "pdf-bytes",
      headers: { "Content-Type": "application/pdf" },
    });
  });
});

describe("HttpClient per-call timeout", () => {
  it("aborts sooner than the client default when a shorter timeout is given", async () => {
    const fetchFn: FetchFn = (_input, init) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(jsonResponse({})), 200);
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        });
      });
    const client = new HttpClient(fetchFn, 5_000, "test-agent", false);
    await expect(client.get("https://example.com/x", { timeout: 10 })).rejects.toThrow();
  });
});

describe("HttpClient retry policy", () => {
  it("retries a 429 and honors a numeric Retry-After", async () => {
    let calls = 0;
    const fetchFn = createMockFetch(() => {
      calls++;
      if (calls === 1) {
        return new Response("", { status: 429, headers: { "retry-after": "0" } });
      }
      return jsonResponse({ ok: true });
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", { baseDelayMs: 1, maxDelayMs: 1 });
    const response = await client.get("https://example.com/x");
    expect(calls).toBe(2);
    expect(response.status).toBe(200);
  });

  it("retries 5xx responses", async () => {
    let calls = 0;
    const fetchFn = createMockFetch(() => {
      calls++;
      if (calls === 1) return new Response("", { status: 503 });
      return jsonResponse({ ok: true });
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", { baseDelayMs: 1, maxDelayMs: 1 });
    const response = await client.get("https://example.com/x");
    expect(calls).toBe(2);
    expect(response.status).toBe(200);
  });

  it("discards the body of a response it is about to retry", async () => {
    const discarded = new Response("busy", { status: 503 });
    let calls = 0;
    const fetchFn = createMockFetch(() => (++calls === 1 ? discarded : jsonResponse({ ok: true })));
    const client = new HttpClient(fetchFn, 30_000, "test-agent", { baseDelayMs: 1, maxDelayMs: 1 });
    await client.get("https://example.com/x");
    await expect(discarded.text()).rejects.toThrow();
  });

  it("gives up after maxAttempts", async () => {
    let calls = 0;
    const fetchFn = createMockFetch(() => {
      calls++;
      return new Response("", { status: 500 });
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", {
      maxAttempts: 2,
      baseDelayMs: 1,
      maxDelayMs: 1,
    });
    const response = await client.get("https://example.com/x");
    expect(calls).toBe(2);
    expect(response.status).toBe(500);
  });

  it("does not retry a call marked retryable: false", async () => {
    let calls = 0;
    const fetchFn = createMockFetch(() => {
      calls++;
      return new Response("", { status: 503 });
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", { baseDelayMs: 1, maxDelayMs: 1 });
    const response = await client.get("https://example.com/x", { retryable: false });
    expect(calls).toBe(1);
    expect(response.status).toBe(503);
  });

  it("does not retry at all when retry is disabled client-wide", async () => {
    let calls = 0;
    const fetchFn = createMockFetch(() => {
      calls++;
      return new Response("", { status: 500 });
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", false);
    const response = await client.get("https://example.com/x");
    expect(calls).toBe(1);
    expect(response.status).toBe(500);
  });

  it("does not retry a 4xx that isn't 429", async () => {
    let calls = 0;
    const fetchFn = createMockFetch(() => {
      calls++;
      return new Response("", { status: 400 });
    });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", { baseDelayMs: 1, maxDelayMs: 1 });
    const response = await client.get("https://example.com/x");
    expect(calls).toBe(1);
    expect(response.status).toBe(400);
  });
});

describe("HttpClient Retry-After ceiling (maxDelayMs)", () => {
  const NOW = Date.UTC(2026, 0, 1, 0, 0, 0);
  const httpDate = (offsetSeconds: number) => new Date(NOW + offsetSeconds * 1000).toUTCString();

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Fails once with `status` + `retryAfter`, then succeeds. */
  function failOnce(status: number, retryAfter: string) {
    const state = { calls: 0 };
    const fetchFn = createMockFetch(() => {
      state.calls++;
      if (state.calls === 1) {
        return new Response("slow down", { status, headers: { "retry-after": retryAfter } });
      }
      return jsonResponse({ ok: true });
    });
    return { state, fetchFn };
  }

  async function expectSleepsThenRetries(fetchFn: FetchFn, state: { calls: number }, sleepMs: number) {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"], now: NOW });
    const client = new HttpClient(fetchFn, 30_000, "test-agent", { maxDelayMs: 10_000, jitter: false });
    const pending = client.get("https://example.com/x");
    await vi.advanceTimersByTimeAsync(sleepMs - 1);
    expect(state.calls).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    const response = await pending;
    expect(state.calls).toBe(2);
    expect(response.status).toBe(200);
  }

  it("honors a seconds Retry-After under the cap", async () => {
    const { state, fetchFn } = failOnce(429, "3");
    await expectSleepsThenRetries(fetchFn, state, 3_000);
  });

  it("honors an HTTP-date Retry-After under the cap", async () => {
    const { state, fetchFn } = failOnce(429, httpDate(4));
    await expectSleepsThenRetries(fetchFn, state, 4_000);
  });

  it("honors a Retry-After exactly at the cap", async () => {
    const { state, fetchFn } = failOnce(503, "10");
    await expectSleepsThenRetries(fetchFn, state, 10_000);
  });

  async function expectNoRetry(status: number, retryAfter: string): Promise<unknown> {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"], now: NOW });
    const { state, fetchFn } = failOnce(status, retryAfter);
    const client = new HttpClient(fetchFn, 30_000, "test-agent", { maxDelayMs: 10_000 });
    const response = await client.get("https://example.com/x");
    expect(state.calls).toBe(1);
    expect(response.status).toBe(status);
    expect(vi.getTimerCount()).toBe(0);
    const error = await ensureOk(response).then(
      () => undefined,
      (e: unknown) => e,
    );
    // The body was not discarded, so the error carries it.
    expect((error as APIError).body).toBe("slow down");
    return error;
  }

  it("returns a 429 without sleeping when a seconds Retry-After exceeds the cap", async () => {
    const error = await expectNoRetry(429, "3600");
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe("3600");
  });

  it("returns a 429 without sleeping when an HTTP-date Retry-After exceeds the cap", async () => {
    const header = httpDate(3600);
    const error = await expectNoRetry(429, header);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(header);
  });

  it("returns a 5xx without sleeping when Retry-After exceeds the cap", async () => {
    const error = await expectNoRetry(503, "11");
    expect(error).toBeInstanceOf(APIError);
    expect(error).not.toBeInstanceOf(RateLimitError);
    expect((error as APIError).statusCode).toBe(503);
    expect((error as APIError).headers?.["retry-after"]).toBe("11");
  });

  it.each(["soon", "Infinity", "NaN"])("falls back to capped backoff for an unusable Retry-After (%s)", async (header) => {
    const { state, fetchFn } = failOnce(429, header);
    await expectSleepsThenRetries(fetchFn, state, 250);
  });
});

describe("raiseForStatus", () => {
  it("throws NotFoundError for a 404 and attaches response headers", () => {
    const response = new Response("", { status: 404, headers: { "X-Test": "1" } });
    try {
      raiseForStatus(response, "{}");
      throw new Error("expected raiseForStatus to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
      expect((error as NotFoundError).headers?.["x-test"]).toBe("1");
    }
  });

  it("is a no-op for an ok response", () => {
    expect(() => raiseForStatus(new Response("", { status: 200 }))).not.toThrow();
  });
});
