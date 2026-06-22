import { describe, expect, it, afterEach } from "vitest";
import {
  DiffbotClient,
  ExtractionError,
  ValidationError,
  extract,
  resolveToken,
} from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";
import { authConfig } from "../src/auth.js";

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

describe("resolveToken", () => {
  const originalEnv = process.env.DIFFBOT_API_TOKEN;
  const originalPath = authConfig.credentialsPath;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.DIFFBOT_API_TOKEN;
    else process.env.DIFFBOT_API_TOKEN = originalEnv;
    authConfig.credentialsPath = originalPath;
  });

  it("prefers explicit token", () => {
    process.env.DIFFBOT_API_TOKEN = "env-token";
    expect(resolveToken("explicit-token")).toBe("explicit-token");
  });

  it("reads env var", () => {
    process.env.DIFFBOT_API_TOKEN = "env-token";
    authConfig.credentialsPath = "/tmp/missing-diffbot-credentials";
    expect(resolveToken()).toBe("env-token");
  });

  it("returns empty when missing", () => {
    delete process.env.DIFFBOT_API_TOKEN;
    authConfig.credentialsPath = "/tmp/missing-diffbot-credentials";
    expect(resolveToken()).toBe("");
  });
});
