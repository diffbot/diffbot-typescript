import { describe, expect, it } from "vitest";
import { ANY_OBJECT_SCHEMA, DiffbotClient, ask, askJson, extractJson, jsonSchemaFormat } from "../src/index.js";
import { createMockFetch, jsonResponse, sseResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const chunk of gen) out.push(chunk);
  return out;
}

const CHUNK = (content: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}`;

const CITY_SCHEMA = {
  type: "object",
  properties: { country: { type: "string" }, capital: { type: "string" } },
  required: ["country", "capital"],
};

describe("ask", () => {
  it("sends a bearer token and streaming chat payload", async () => {
    let body = "";
    const db = makeClient((req) => {
      expect(req.headers.get("authorization")).toBe("Bearer test-token");
      body = req.body ?? "";
      return sseResponse(`${CHUNK("Hi")}\n`);
    });
    const chunks = await collect(ask(db, [{ role: "user", content: "hello" }]));
    expect(chunks).toEqual(["Hi"]);
    const parsed = JSON.parse(body);
    expect(parsed.stream).toBe(true);
    expect(parsed.messages).toEqual([{ role: "user", content: "hello" }]);
  });

  it("skips malformed and contentless chunks", async () => {
    const db = makeClient(() =>
      sseResponse([CHUNK("Hello "), "data: not-json", "data: {}", CHUNK("world")].join("\n")),
    );
    expect((await collect(ask(db, [{ role: "user", content: "x" }]))).join("")).toBe("Hello world");
  });

  it("falls back to text when the response has no body stream", async () => {
    const db = makeClient(() => {
      const res = new Response(`${CHUNK("from")}\n${CHUNK(" text")}`, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
      Object.defineProperty(res, "body", { value: null });
      return res;
    });
    expect((await collect(ask(db, [{ role: "user", content: "x" }]))).join("")).toBe("from text");
  });

  it("raises on error status", async () => {
    const db = makeClient(() => jsonResponse({ code: 401, message: "nope" }, 401));
    await expect(collect(ask(db, [{ role: "user", content: "x" }]))).rejects.toMatchObject({
      name: "AuthError",
    });
  });
});

describe("jsonSchemaFormat", () => {
  it("nests the schema where the server looks for it", () => {
    const fmt = jsonSchemaFormat(CITY_SCHEMA);
    expect(fmt.type).toBe("json_schema");
    expect(fmt.json_schema?.schema).toBe(CITY_SCHEMA);
    expect(fmt.json_schema?.name).toBe("response");
  });

  it("accepts a custom name", () => {
    expect(jsonSchemaFormat(CITY_SCHEMA, "city").json_schema?.name).toBe("city");
  });

  it("rejects a non-object schema", () => {
    expect(() => jsonSchemaFormat("not a schema" as never)).toThrow("JSON Schema object");
  });
});

describe("ask responseFormat", () => {
  it("omits response_format when unset", async () => {
    let body = "";
    const db = makeClient((req) => {
      body = req.body ?? "";
      return sseResponse(`${CHUNK("Hi")}\n`);
    });
    await collect(ask(db, [{ role: "user", content: "hello" }]));
    expect(JSON.parse(body)).not.toHaveProperty("response_format");
  });

  it("sends response_format when set", async () => {
    let body = "";
    const db = makeClient((req) => {
      body = req.body ?? "";
      return sseResponse(`${CHUNK("{}")}\n`);
    });
    const fmt = jsonSchemaFormat(CITY_SCHEMA);
    await collect(ask(db, [{ role: "user", content: "hello" }], { responseFormat: fmt }));
    expect(JSON.parse(body).response_format).toEqual(fmt);
  });

  it("accepts the known types", async () => {
    const db = makeClient(() => sseResponse(`${CHUNK("x")}\n`));
    for (const responseFormat of [{ type: "text" }, { type: "json_object" }, jsonSchemaFormat(CITY_SCHEMA)] as const) {
      await collect(ask(db, [{ role: "user", content: "x" }], { responseFormat }));
    }
  });

  it("rejects an unknown type before sending", async () => {
    let called = false;
    const db = makeClient(() => {
      called = true;
      return sseResponse("");
    });
    await expect(
      collect(ask(db, [{ role: "user", content: "x" }], { responseFormat: { type: "nope" as never } })),
    ).rejects.toThrow("text, json_object, json_schema");
    expect(called).toBe(false);
  });

  it("rejects json_schema without the nested schema", async () => {
    const db = makeClient(() => sseResponse(""));
    // Server-side this returns 200 and silently ignores the constraint.
    await expect(
      collect(
        ask(db, [{ role: "user", content: "x" }], {
          responseFormat: { type: "json_schema", json_schema: CITY_SCHEMA as never },
        }),
      ),
    ).rejects.toMatchObject({ name: "ValidationError" });
    await expect(
      collect(ask(db, [{ role: "user", content: "x" }], { responseFormat: { type: "json_schema" } })),
    ).rejects.toMatchObject({ name: "ValidationError" });
  });
});

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"capital": "Paris"}')).toEqual({ capital: "Paris" });
  });

  it("strips a think block", () => {
    // The RAG grammar permits a think block before the final JSON answer.
    expect(extractJson('<think>Sufficient information gathered.</think>\n{"capital": "Paris"}')).toEqual({
      capital: "Paris",
    });
    expect(extractJson('<think>line one\nline two</think>{"a": 1}')).toEqual({ a: 1 });
  });

  it("strips a markdown fence", () => {
    expect(extractJson('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it("parses a top-level array", () => {
    expect(extractJson('[{"city": "NYC"}]')).toEqual([{ city: "NYC" }]);
  });

  it("falls back to an embedded object", () => {
    expect(extractJson('Here you go: {"a": 1} hope that helps')).toEqual({ a: 1 });
  });

  it("throws on unparseable text", () => {
    expect(() => extractJson("I could not find an answer.")).toThrow("could not parse JSON");
  });
});

describe("askJson", () => {
  function captureBody(content: string) {
    let body = "";
    const db = makeClient((req) => {
      body = req.body ?? "";
      return sseResponse(`${CHUNK(content)}\n`);
    });
    return { db, body: () => JSON.parse(body) };
  }

  it("wraps a bare schema and parses the answer", async () => {
    const { db, body } = captureBody('{"country": "France", "capital": "Paris"}');
    const result = await askJson<{ capital: string }>(db, [{ role: "user", content: "x" }], CITY_SCHEMA);
    expect(result.capital).toBe("Paris");
    expect(body().response_format).toEqual(jsonSchemaFormat(CITY_SCHEMA));
  });

  it("defaults to the permissive schema, not json_object", async () => {
    // json_object has no server-side grammar and leaks the internal tool call.
    const { db, body } = captureBody("{}");
    await askJson(db, [{ role: "user", content: "x" }]);
    expect(body().response_format).toEqual(jsonSchemaFormat(ANY_OBJECT_SCHEMA));
  });

  it("passes an explicit responseFormat through", async () => {
    const { db, body } = captureBody("{}");
    await askJson(db, [{ role: "user", content: "x" }], undefined, { responseFormat: { type: "json_object" } });
    expect(body().response_format).toEqual({ type: "json_object" });
  });

  it("rejects both schema and responseFormat", async () => {
    const { db } = captureBody("{}");
    await expect(
      askJson(db, [{ role: "user", content: "x" }], CITY_SCHEMA, { responseFormat: { type: "json_object" } }),
    ).rejects.toThrow("not both");
  });

  it("rejects a leaked tool call", async () => {
    const { db } = captureBody(JSON.stringify({ name: "functioncall", arguments: { name: "dql_v1", arguments: {} } }));
    await expect(askJson(db, [{ role: "user", content: "x" }])).rejects.toThrow("internal tool call");
  });

  it("allows a legitimate name field and lists", async () => {
    // A legitimate answer may well have a "name" field.
    expect(await askJson(captureBody('{"name": "functioncall"}').db, [{ role: "user", content: "x" }])).toEqual({
      name: "functioncall",
    });
    expect(await askJson(captureBody('[{"city": "NYC"}]').db, [{ role: "user", content: "x" }])).toEqual([
      { city: "NYC" },
    ]);
  });
});
