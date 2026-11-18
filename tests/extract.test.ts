import { afterEach, describe, expect, it, vi } from "vitest";
import { DiffbotClient, ExtractionError, ValidationError, extract } from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("extract", () => {
  it("returns raw dict", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("token")).toBe("test-token");
      expect(req.params.get("url")).toBe("https://example.com");
      return jsonResponse({ objects: [{ title: "Example", pageUrl: "https://example.com" }] });
    });
    const result = await extract(db, "https://example.com");
    expect(result).toEqual({ objects: [{ title: "Example", pageUrl: "https://example.com" }] });
  });

  it("normalizes url", async () => {
    let captured = "";
    const db = makeClient((req) => {
      captured = req.params.get("url") ?? "";
      return jsonResponse({ objects: [] });
    });
    await extract(db, "example.com");
    expect(captured).toBe("https://example.com");
  });

  it("requires token", () => {
    expect(() => new DiffbotClient({ token: "" })).toThrow(ValidationError);
  });

  it("sets user-agent header", async () => {
    let ua = "";
    const db = makeClient((req) => {
      ua = req.headers.get("user-agent") ?? "";
      return jsonResponse({});
    });
    await extract(db, "example.com");
    expect(ua.startsWith("diffbot-typescript/")).toBe(true);
  });

  it("raises AuthError on 401", async () => {
    const db = makeClient(() =>
      jsonResponse({ code: 401, message: "Unauthorized. Incorrect token.", requestId: "123456789" }, 401),
    );
    await expect(extract(db, "example.com")).rejects.toMatchObject({
      name: "AuthError",
      statusCode: 401,
      apiMessage: "Unauthorized. Incorrect token.",
      requestId: "123456789",
    });
  });

  it("raises ExtractionError on 200 with errorCode", async () => {
    const db = makeClient(() => jsonResponse({ errorCode: 500, error: "Could not download page (403)" }));
    await expect(extract(db, "example.com")).rejects.toMatchObject({
      name: "ExtractionError",
      errorCode: 500,
    });
  });

  it("closes client", async () => {
    const db = makeClient(() => jsonResponse({}));
    await extract(db, "example.com");
    await db.close();
    expect(db.http.isClosed).toBe(true);
  });

  it("disposes client with await using", async () => {
    let db: DiffbotClient;
    {
      await using scoped = new DiffbotClient({
        token: "test-token",
        fetch: createMockFetch(() => jsonResponse({})),
      });
      db = scoped;
      await extract(scoped, "example.com");
    }
    expect(db.http.isClosed).toBe(true);
  });
});

describe("extract options", () => {
  afterEach(() => vi.restoreAllMocks());

  function capture(clientTimeout?: number) {
    const seen: { params?: URLSearchParams } = {};
    const db = new DiffbotClient({
      token: "test-token",
      timeout: clientTimeout,
      fetch: createMockFetch((req) => {
        seen.params = req.params;
        return jsonResponse({ objects: [] });
      }),
    });
    return { db, seen };
  }

  it("keeps the legacy wire defaults when no options are given", async () => {
    const { db, seen } = capture();
    await extract(db, "example.com");
    expect(Object.fromEntries(seen.params!)).toEqual({
      token: "test-token",
      url: "https://example.com",
      timeout: "30000",
      mode: "llm",
    });
  });

  it("sends named options, joining fields with commas", async () => {
    const { db, seen } = capture();
    await extract(db, "example.com", "article", "json", {
      fields: ["links", "meta"],
      paging: false,
      maxTags: 5,
      tagConfidence: 0.5,
      categoryConfidence: 0.25,
      discussion: true,
      naturalLanguage: ["entities", "sentiment"],
      summaryNumSentences: 3,
      useProxy: "default",
    });
    expect(Object.fromEntries(seen.params!)).toMatchObject({
      fields: "links,meta",
      paging: "false",
      maxTags: "5",
      tagConfidence: "0.5",
      categoryConfidence: "0.25",
      discussion: "true",
      naturalLanguage: "entities,sentiment",
      summaryNumSentences: "3",
      useProxy: "default",
    });
    expect(seen.params!.has("mode")).toBe(false);
  });

  it("sends discussion and analyze-only options", async () => {
    const { db, seen } = capture();
    await extract(db, "example.com", "discussion", "json", { maxPages: 3 });
    expect(seen.params!.get("maxPages")).toBe("3");
    await extract(db, "example.com", "analyze", "json", { fallback: "article" });
    expect(seen.params!.get("fallback")).toBe("article");
  });

  it("an explicit mode overrides the fmt=markdown mapping", async () => {
    const { db, seen } = capture();
    await extract(db, "example.com", "analyze", "markdown", { mode: "article" });
    expect(seen.params!.get("mode")).toBe("article");
    await extract(db, "example.com", "analyze", "markdown");
    expect(seen.params!.get("mode")).toBe("llm");
  });

  it("passes proxy/proxyAuth through typed extra", async () => {
    const { db, seen } = capture();
    await extract(db, "example.com", "article", "json", { extra: { proxy: "host:80", proxyAuth: "u:p" } });
    expect(seen.params!.get("proxy")).toBe("host:80");
    expect(seen.params!.get("proxyAuth")).toBe("u:p");
  });

  describe("timeout vs transport timeout", () => {
    function spyTransport() {
      const spy = vi.spyOn(AbortSignal, "timeout");
      return () => spy.mock.calls.map((c) => c[0]);
    }

    it("sends a caller timeout on the wire and raises the transport timeout above it", async () => {
      const calls = spyTransport();
      const { db, seen } = capture(30_000);
      await extract(db, "example.com", "article", "json", { timeout: 90_000 });
      expect(seen.params!.get("timeout")).toBe("90000");
      expect(calls()).toEqual([100_000]);
    });

    it("keeps a larger client timeout when the caller's timeout is small", async () => {
      const calls = spyTransport();
      const { db, seen } = capture(120_000);
      await extract(db, "example.com", "article", "json", { timeout: 5_000 });
      expect(seen.params!.get("timeout")).toBe("5000");
      expect(calls()).toEqual([120_000]);
    });

    it("never aborts before the default 30s wire timeout can answer", async () => {
      const calls = spyTransport();
      const { db } = capture(10_000);
      await extract(db, "example.com");
      expect(calls()).toEqual([40_000]);
    });
  });
});
