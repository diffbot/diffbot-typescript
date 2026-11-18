import { describe, expect, it } from "vitest";
import { DiffbotClient, ValidationError, webSearch } from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("webSearch", () => {
  it("sends a bearer token and the query text", async () => {
    const db = makeClient((req) => {
      expect(req.headers.get("authorization")).toBe("Bearer test-token");
      expect(req.params.get("text")).toBe("diffbot");
      expect(req.params.get("size")).toBeNull();
      expect(req.params.get("maxTokens")).toBeNull();
      return jsonResponse({ results: [] });
    });
    const result = await webSearch(db, "diffbot");
    expect(result).toEqual({ results: [] });
  });

  it("forwards numResults and maxTokens options", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("size")).toBe("5");
      expect(req.params.get("maxTokens")).toBe("1000");
      return jsonResponse({ results: [] });
    });
    await webSearch(db, "diffbot", { numResults: 5, maxTokens: 1000 });
  });

  it("omits snippetLength and rerank unless asked", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("snippetLength")).toBeNull();
      expect(req.params.get("rerank")).toBeNull();
      return jsonResponse({ search_results: [] });
    });
    await webSearch(db, "diffbot", { numResults: 3 });
  });

  it("sends snippetLength upper-cased", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("size")).toBe("3");
      expect(req.params.get("snippetLength")).toBe("SHORT");
      expect(req.params.get("rerank")).toBeNull();
      return jsonResponse({ search_results: [] });
    });
    await webSearch(db, "diffbot", { numResults: 3, snippetLength: "short" });
  });

  it("disables reranking for full snippets", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("snippetLength")).toBe("FULL");
      expect(req.params.get("rerank")).toBe("none");
      return jsonResponse({ search_results: [] });
    });
    await webSearch(db, "url:https://example.com", { snippetLength: "full" });
  });

  it("rejects an unknown snippetLength", async () => {
    const db = makeClient(() => jsonResponse({ search_results: [] }));
    await expect(
      webSearch(db, "diffbot", { snippetLength: "huge" as never }),
    ).rejects.toMatchObject({ name: "ValidationError" });
  });

  it("raises on error status", async () => {
    const db = makeClient(() => jsonResponse({ code: 401, message: "nope" }, 401));
    await expect(webSearch(db, "diffbot")).rejects.toMatchObject({ name: "AuthError" });
  });
});

describe("webSearch multi-value text", () => {
  function capture() {
    const seen: { texts?: string[]; method?: string; called: boolean } = { called: false };
    const db = makeClient((req) => {
      seen.called = true;
      seen.method = req.method;
      seen.texts = req.params.getAll("text");
      return jsonResponse({ results: [] });
    });
    return { db, seen };
  }

  it("sends one string as a single text param (GET)", async () => {
    const { db, seen } = capture();
    await webSearch(db, "diffbot");
    expect(seen.method).toBe("GET");
    expect(seen.texts).toEqual(["diffbot"]);
  });

  it("treats a one-element array like a string", async () => {
    const { db, seen } = capture();
    await webSearch(db, ["diffbot"]);
    expect(seen.texts).toEqual(["diffbot"]);
  });

  it("sends 2 values as repeated text params", async () => {
    const { db, seen } = capture();
    await webSearch(db, ["a b", "c&d"], { numResults: 1 });
    expect(seen.method).toBe("GET");
    expect(seen.texts).toEqual(["a b", "c&d"]);
  });

  it("accepts 5 values", async () => {
    const { db, seen } = capture();
    await webSearch(db, ["1", "2", "3", "4", "5"]);
    expect(seen.texts).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("rejects 0 and 6 values without sending", async () => {
    const { db, seen } = capture();
    await expect(webSearch(db, [])).rejects.toBeInstanceOf(ValidationError);
    await expect(webSearch(db, ["1", "2", "3", "4", "5", "6"])).rejects.toBeInstanceOf(ValidationError);
    expect(seen.called).toBe(false);
  });
});
