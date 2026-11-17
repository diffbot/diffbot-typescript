import { describe, expect, it } from "vitest";
import { DiffbotClient, dql, dqlFetchOntologyText, dqlParallel } from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

function bodyOf(req: { body?: string }): Record<string, unknown> {
  return JSON.parse(req.body ?? "{}") as Record<string, unknown>;
}

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("dql", () => {
  it("sends token, query, and default size", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("token")).toBe("test-token");
      expect(bodyOf(req)).toEqual({ query: "type:Organization", size: 10 });
      return jsonResponse({ data: [], hits: 0 });
    });
    const result = await dql(db, "type:Organization");
    expect(result).toEqual({ data: [], hits: 0 });
  });

  it("POSTs JSON with the token in the query string and the query out of the URL", async () => {
    let seen = false;
    const db = makeClient((req) => {
      seen = true;
      expect(req.method).toBe("POST");
      expect(req.headers.get("content-type")).toBe("application/json");
      expect([...req.params.keys()]).toEqual(["token"]);
      expect(req.params.get("query")).toBeNull();
      expect(req.body).not.toContain("test-token");
      expect(bodyOf(req).query).toBe("type:Organization name:Acme");
      return jsonResponse({ data: [] });
    });
    await dql(db, "type:Organization name:Acme");
    expect(seen).toBe(true);
  });

  it("retries a 503 on the POST", async () => {
    let calls = 0;
    const db = new DiffbotClient({
      token: "test-token",
      retry: { baseDelayMs: 1, maxDelayMs: 1 },
      fetch: createMockFetch(() => (++calls < 2 ? jsonResponse({}, 503) : jsonResponse({ data: [] }))),
    });
    await dql(db, "type:Organization");
    expect(calls).toBe(2);
  });

  it("forwards options and omits json format", async () => {
    const db = makeClient((req) => {
      expect(bodyOf(req)).toEqual({
        query: "type:Person",
        size: 25,
        from: 5,
        filter: "foo",
        exportspec: "bar",
        extraKey: "extraVal",
      });
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
      expect(bodyOf(req).format).toBe("csv");
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

  it("streams format: jsonl as an async generator of entities", async () => {
    const lines = `${JSON.stringify({ value: "a" })}\n${JSON.stringify({ value: "b" })}\n`;
    const db = makeClient((req) => {
      expect(bodyOf(req).format).toBe("jsonl");
      return new Response(lines, { status: 200 });
    });
    const result = await dql(db, "type:Organization", { format: "jsonl" });
    const items: unknown[] = [];
    for await (const item of result) items.push(item);
    expect(items).toEqual([{ value: "a" }, { value: "b" }]);
  });

  it("returns format: csv as plain text, not a JSON.parse attempt", async () => {
    const db = makeClient(() => new Response("name,hits\nAcme,3\n", { status: 200 }));
    const result = await dql(db, "type:Organization", { format: "csv" });
    expect(result).toBe("name,hits\nAcme,3\n");
  });

  it("preserves non-UTF-8 bytes in raw mode instead of corrupting them (xls/xlsx export)", async () => {
    // Invalid-UTF-8 byte sequences, as in a binary xls/xlsx body. Previously the response
    // was decoded as text (lossily, to U+FFFD) and then re-encoded, corrupting these bytes.
    const binary = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x80, 0x81]);
    const db = makeClient(() =>
      new Response(binary, { status: 200, headers: { "Content-Type": "application/vnd.ms-excel" } }),
    );
    const result = await dql(db, "type:Organization", { format: "xlsx", raw: true });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result as Uint8Array)).toEqual(Array.from(binary));
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

  it("defaults to the public DQL endpoint", async () => {
    const db = makeClient((req) => {
      expect(req.url).toBe("https://kg.diffbot.com/kg/v3/dql");
      return jsonResponse({ data: [] });
    });
    await dql(db, "type:Organization");
  });

  it("honors a custom dqlUrl", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      dqlUrl: "http://localhost:8080/kg/v3/dql",
      fetch: createMockFetch((req) => {
        expect(req.url).toBe("http://localhost:8080/kg/v3/dql");
        return jsonResponse({ data: [] });
      }),
    });
    await dql(db, "type:Organization");
  });
});

describe("dqlParallel", () => {
  it("returns empty array for no queries", async () => {
    const db = makeClient(() => jsonResponse({}));
    expect(await dqlParallel(db, [])).toEqual([]);
  });

  it("runs queries and preserves order", async () => {
    const db = makeClient((req) => {
      return jsonResponse({ query: bodyOf(req).query });
    });
    const results = await dqlParallel(
      db,
      [{ query: "a" }, { query: "b" }, { query: "c" }],
      2,
    );
    expect(results).toEqual([{ query: "a" }, { query: "b" }, { query: "c" }]);
  });

  it("forwards per-query options", async () => {
    const db = makeClient((req) => jsonResponse({ size: bodyOf(req).size }));
    const results = await dqlParallel(db, [{ query: "a", size: 50 }]);
    expect(results).toEqual([{ size: 50 }]);
  });
});

describe("dqlFetchOntologyText", () => {
  it("returns the raw ontology body", async () => {
    const payload = { types: { Organization: {} } };
    const db = makeClient((req) => {
      expect(req.url).toContain("/ontology");
      return jsonResponse(payload);
    });
    const text = await dqlFetchOntologyText(db);
    expect(JSON.parse(text)).toEqual(payload);
  });

  it("raises on error status", async () => {
    const db = makeClient(() => jsonResponse({ code: 401, message: "nope" }, 401));
    await expect(dqlFetchOntologyText(db)).rejects.toMatchObject({ name: "AuthError" });
  });

  it("defaults to the public ontology endpoint", async () => {
    const db = makeClient((req) => {
      expect(req.url).toBe("https://kg.diffbot.com/kg/ontology");
      return jsonResponse({ types: {} });
    });
    await dqlFetchOntologyText(db);
  });

  it("honors a custom ontologyUrl", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      ontologyUrl: "http://localhost:8080/kg/ontology",
      fetch: createMockFetch((req) => {
        expect(req.url).toBe("http://localhost:8080/kg/ontology");
        return jsonResponse({ types: {} });
      }),
    });
    await dqlFetchOntologyText(db);
  });
});
