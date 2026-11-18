import { describe, expect, it } from "vitest";
import { DiffbotClient, account, verifyToken } from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0], extra: { retry?: false } = {}) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler), ...extra });
}

describe("account", () => {
  it("GETs /v4/account with the token and no days by default", async () => {
    const db = makeClient((req) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("https://api.diffbot.com/v4/account");
      expect(req.params.get("token")).toBe("test-token");
      expect(req.params.has("days")).toBe(false);
      return jsonResponse({ name: "Diffy", plan: "p", status: "active", usage: [{ date: "2022-05-04", credits: 1 }] });
    });
    const result = await account(db);
    expect(result.status).toBe("active");
    expect(result.usage?.[0]?.credits).toBe(1);
  });

  it("forwards days", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("days")).toBe("365");
      return jsonResponse({});
    });
    await account(db, { days: 365 });
  });

  it("honors apiBase", async () => {
    const db = new DiffbotClient({
      token: "t",
      apiBase: "http://localhost:9000",
      fetch: createMockFetch((req) => {
        expect(req.url).toBe("http://localhost:9000/v4/account");
        return jsonResponse({});
      }),
    });
    await account(db);
  });
});

describe("verifyToken", () => {
  it("is true on success and asks for a single day", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("days")).toBe("1");
      return jsonResponse({ status: "active" });
    });
    expect(await verifyToken(db)).toBe(true);
  });

  it.each([401, 403])("is false on %i (AuthError)", async (status) => {
    const db = makeClient(() => jsonResponse({ code: status, message: "bad token" }, status));
    expect(await verifyToken(db)).toBe(false);
  });

  it("propagates non-auth errors", async () => {
    const db = makeClient(() => jsonResponse({ message: "boom" }, 500), { retry: false });
    await expect(verifyToken(db)).rejects.toMatchObject({ statusCode: 500 });
    const limited = makeClient(() => jsonResponse({ message: "slow" }, 429), { retry: false });
    await expect(verifyToken(limited)).rejects.toMatchObject({ name: "RateLimitError" });
  });

  it("propagates network errors", async () => {
    const db = new DiffbotClient({
      token: "t",
      retry: false,
      fetch: () => Promise.reject(new TypeError("fetch failed")),
    });
    await expect(verifyToken(db)).rejects.toThrow("fetch failed");
  });
});
