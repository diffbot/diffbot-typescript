import { describe, expect, it } from "vitest";
import { NotFoundError } from "../src/errors.js";
import { HttpClient, raiseForStatus, type FetchFn } from "../src/http.js";
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
