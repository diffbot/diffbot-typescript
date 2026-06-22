import { describe, expect, it } from "vitest";
import { DiffbotClient, entities } from "../src/index.js";
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
