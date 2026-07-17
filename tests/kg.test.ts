import { describe, expect, it, afterEach } from "vitest";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DiffbotClient, dql, dqlParallel, dqlRefreshOntology } from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("dql", () => {
  it("sends token, query, and default size", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("token")).toBe("test-token");
      expect(req.params.get("query")).toBe('type:Organization');
      expect(req.params.get("size")).toBe("10");
      return jsonResponse({ data: [], hits: 0 });
    });
    const result = await dql(db, "type:Organization");
    expect(result).toEqual({ data: [], hits: 0 });
  });

  it("forwards options and omits json format", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("size")).toBe("25");
      expect(req.params.get("from")).toBe("5");
      expect(req.params.get("filter")).toBe("foo");
      expect(req.params.get("exportspec")).toBe("bar");
      expect(req.params.get("format")).toBeNull();
      expect(req.params.get("extraKey")).toBe("extraVal");
      return jsonResponse({ data: [] });
    });
    await dql(db, "type:Person", {
      size: 25,
      from: 5,
      format: "json",
      filter: "foo",
      exportspec: "bar",
      extra: { extraKey: "extraVal" },
    });
  });

  it("sets non-json format", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("format")).toBe("csv");
      return jsonResponse({ data: [] });
    });
    await dql(db, "type:Person", { format: "csv" });
  });

  it("returns raw bytes when raw is set", async () => {
    const db = makeClient(() => jsonResponse({ data: [{ name: "Acme" }] }));
    const result = await dql(db, "type:Organization", { raw: true });
    expect(result).toBeInstanceOf(Uint8Array);
    const text = new TextDecoder().decode(result as Uint8Array);
    expect(JSON.parse(text)).toEqual({ data: [{ name: "Acme" }] });
  });

  it("raises AuthError on 401", async () => {
    const db = makeClient(() =>
      jsonResponse({ code: 401, message: "Unauthorized. Incorrect token." }, 401),
    );
    await expect(dql(db, "type:Organization")).rejects.toMatchObject({
      name: "AuthError",
      statusCode: 401,
    });
  });
});

describe("dqlParallel", () => {
  it("returns empty array for no queries", async () => {
    const db = makeClient(() => jsonResponse({}));
    expect(await dqlParallel(db, [])).toEqual([]);
  });

  it("runs queries and preserves order", async () => {
    const db = makeClient((req) => {
      const query = req.params.get("query")!;
      return jsonResponse({ query });
    });
    const results = await dqlParallel(
      db,
      [{ query: "a" }, { query: "b" }, { query: "c" }],
      2,
    );
    expect(results).toEqual([{ query: "a" }, { query: "b" }, { query: "c" }]);
  });

  it("forwards per-query options", async () => {
    const db = makeClient((req) => jsonResponse({ size: req.params.get("size") }));
    const results = await dqlParallel(db, [{ query: "a", size: 50 }]);
    expect(results).toEqual([{ size: "50" }]);
  });
});

describe("dqlRefreshOntology", () => {
  const dest = join(tmpdir(), `diffbot-ontology-${process.pid}`, "ontology.json");

  afterEach(async () => {
    await rm(join(tmpdir(), `diffbot-ontology-${process.pid}`), { recursive: true, force: true });
  });

  it("writes the ontology body to disk, creating dirs", async () => {
    const payload = { types: { Organization: {} } };
    const db = makeClient((req) => {
      expect(req.url).toContain("/ontology");
      return jsonResponse(payload);
    });
    await dqlRefreshOntology(db, dest);
    const written = await readFile(dest, "utf8");
    expect(JSON.parse(written)).toEqual(payload);
  });

  it("raises on error status", async () => {
    const db = makeClient(() => jsonResponse({ code: 401, message: "nope" }, 401));
    await expect(dqlRefreshOntology(db, dest)).rejects.toMatchObject({ name: "AuthError" });
  });
});
