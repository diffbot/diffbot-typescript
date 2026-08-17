import { describe, expect, it } from "vitest";
import { env } from "cloudflare:test";
import {
  DiffbotClient,
  ask,
  dql,
  resolveTokenFromEnv,
  KVOntologyStore,
} from "@diffbot/typescript";
import { createMockFetch, jsonResponse } from "./mock-fetch.js";

interface FixtureEnv {
  DIFFBOT_ONTOLOGY: KVNamespace;
  DIFFBOT_API_TOKEN?: string;
}

const fixtureEnv = env as unknown as FixtureEnv;

describe("@diffbot/typescript in workerd", () => {
  it("imports and constructs a client with no compat flags", () => {
    // If this test file loaded at all, importing the package succeeded in
    // workerd without nodejs_compat on the fixture-under-test config — the
    // point of this whole fixture.
    const client = new DiffbotClient({ token: "test-token" });
    expect(client.token).toBe("test-token");
  });

  it("resolveTokenFromEnv reads the Workers env binding", () => {
    expect(resolveTokenFromEnv(undefined, { DIFFBOT_API_TOKEN: "env-token" })).toBe("env-token");
  });

  it("dql runs over a mocked fetch", async () => {
    const client = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch(() => jsonResponse({ data: [{ entity: { name: "Diffbot" } }] })),
    });
    const result = (await dql(client, 'type:Organization name:"Diffbot"', {
      size: 1,
    })) as { data: Array<{ entity: { name: string } }> };
    expect(result.data[0]?.entity.name).toBe("Diffbot");
  });

  it("ask streams SSE chunks via ReadableStream.getReader()", async () => {
    const sse = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      "data: [DONE]\n\n",
    ].join("");
    const client = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch(
        () =>
          new Response(sse, { status: 200, headers: { "Content-Type": "text/event-stream" } }),
      ),
    });
    const chunks: string[] = [];
    for await (const chunk of ask(client, [{ role: "user", content: "hi" }])) {
      chunks.push(chunk);
    }
    expect(chunks.join("")).toBe("Hello world");
  });

  it("KVOntologyStore round-trips through a real KV binding", async () => {
    let fetches = 0;
    const client = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch(() => {
        fetches++;
        return jsonResponse({ types: { Organization: {} } });
      }),
    });

    const store = new KVOntologyStore(client, fixtureEnv.DIFFBOT_ONTOLOGY);
    const first = await store.load();
    expect(first.types()).toEqual(["Organization"]);
    expect(fetches).toBe(1);

    // A second, freshly constructed store simulates a recycled isolate.
    const second = new KVOntologyStore(client, fixtureEnv.DIFFBOT_ONTOLOGY);
    const cached = await second.load();
    expect(cached.types()).toEqual(["Organization"]);
    expect(fetches).toBe(1); // served from KV, no second fetch

    await second.load({ refresh: true });
    expect(fetches).toBe(2);
  });
});
