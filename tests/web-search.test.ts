import { describe, expect, it } from "vitest";
import { DiffbotClient, webSearch } from "../src/index.js";
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

  it("raises on error status", async () => {
    const db = makeClient(() => jsonResponse({ code: 401, message: "nope" }, 401));
    await expect(webSearch(db, "diffbot")).rejects.toMatchObject({ name: "AuthError" });
  });
});
