import { describe, expect, it } from "vitest";
import { DiffbotClient, ValidationError, entities, nlp } from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("entities", () => {
  it("unwraps the first element of an array response", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("token")).toBe("test-token");
      expect(req.params.get("fields")).toBe("entities,sentiment");
      expect(req.method).toBe("POST");
      return jsonResponse([{ entities: [{ name: "Acme" }] }, { ignored: true }]);
    });
    const result = await entities(db, "Acme Corp makes things.");
    expect(result).toEqual({ entities: [{ name: "Acme" }] });
  });

  it("returns an object response directly", async () => {
    const db = makeClient(() => jsonResponse({ entities: [] }));
    expect(await entities(db, "text")).toEqual({ entities: [] });
  });

  it("returns {} for an empty array response", async () => {
    const db = makeClient(() => jsonResponse([]));
    expect(await entities(db, "text")).toEqual({});
  });

  it("defaults lang to auto and forwards overrides", async () => {
    let body = "";
    const dbDefault = makeClient((req) => {
      body = req.body ?? "";
      return jsonResponse({});
    });
    await entities(dbDefault, "hello");
    expect(JSON.parse(body)[0].lang).toBe("auto");

    const dbFr = makeClient((req) => {
      body = req.body ?? "";
      return jsonResponse({});
    });
    await entities(dbFr, "bonjour", "fr");
    expect(JSON.parse(body)[0].lang).toBe("fr");
  });
});

describe("nlp", () => {
  function capture(response: unknown = [{}]) {
    const seen: { params?: URLSearchParams; body?: Array<Record<string, unknown>>; method?: string; url?: string } = {};
    const db = makeClient((req) => {
      seen.params = req.params;
      seen.method = req.method;
      seen.url = req.url;
      seen.body = JSON.parse(req.body ?? "[]") as Array<Record<string, unknown>>;
      return jsonResponse(response);
    });
    return { db, seen };
  }

  it("posts one document with comma-joined fields and defaults", async () => {
    const { db, seen } = capture([{ summary: "s", language: "en" }]);
    const result = await nlp(db, "Hello world.", { fields: ["summary", "language"] });
    expect(seen.method).toBe("POST");
    expect(seen.url).toContain("nl.diffbot.com/v1/");
    expect(seen.params!.get("token")).toBe("test-token");
    expect(seen.params!.get("fields")).toBe("summary,language");
    expect(seen.body).toEqual([{ lang: "auto", format: "plain text", content: "Hello world." }]);
    expect(result).toEqual({ summary: "s", language: "en" });
  });

  it("forwards lang, format, documentType and customSummary", async () => {
    const { db, seen } = capture();
    await nlp(db, "Title\nBody", {
      fields: ["summary"],
      lang: "en",
      format: "plain text with title",
      documentType: "news article",
      customSummary: { maxNumberOfSentences: 2 },
    });
    expect(seen.body).toEqual([
      {
        lang: "en",
        format: "plain text with title",
        content: "Title\nBody",
        documentType: "news article",
        customSummary: { maxNumberOfSentences: 2 },
      },
    ]);
  });

  it("accepts an object response and returns {} for an empty array", async () => {
    expect(await nlp(capture({ sentiment: 0.1 }).db, "x", { fields: ["sentiment"] })).toEqual({ sentiment: 0.1 });
    expect(await nlp(capture([]).db, "x", { fields: ["sentiment"] })).toEqual({});
  });

  it("rejects empty fields without sending", async () => {
    const { db, seen } = capture();
    await expect(nlp(db, "x", { fields: [] })).rejects.toBeInstanceOf(ValidationError);
    expect(seen.method).toBeUndefined();
  });

  it("leaves entities() on entities,sentiment", async () => {
    const { db, seen } = capture();
    await entities(db, "x");
    expect(seen.params!.get("fields")).toBe("entities,sentiment");
    expect(seen.body).toEqual([{ lang: "auto", format: "plain text", content: "x" }]);
  });
});
