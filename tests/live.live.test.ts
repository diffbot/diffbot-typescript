/*
  Live integration tests against the real Diffbot APIs. Mirrors the @live-marked
  tests in the Python SDK (test_extract.py, test_ask.py, test_dql.py,
  test_web_search.py, test_async.py). Skipped unless a token is resolvable via
  DIFFBOT_API_TOKEN or ~/.diffbot/credentials. Run with `pnpm test:live`.
*/

import { describe, expect, it } from "vitest";
import { Diffbot, DiffbotAsync, resolveToken } from "../src/index.js";
import type { JsonObject } from "../src/types.js";

const token = resolveToken();
const live = token ? it : it.skip;

describe("live", () => {
  live("extract", async () => {
    const db = new Diffbot({ token });
    const result = await db.extract("https://example.com");
    const objects = result.objects as JsonObject[];
    expect(objects.length).toBeGreaterThan(0);
    expect(objects[0]).toHaveProperty("content");
    await db.close();
  });

  live("ask streams content", async () => {
    const db = new Diffbot({ token });
    const chunks: string[] = [];
    for await (const chunk of db.ask([{ role: "user", content: "What is Diffbot?" }])) {
      chunks.push(chunk);
    }
    expect(chunks.join("").length).toBeGreaterThan(0);
    await db.close();
  });

  live("dql", async () => {
    const db = new Diffbot({ token });
    const result = (await db.dql('type:Organization name:"Diffbot"', { size: 1 })) as JsonObject;
    const data = result.data as JsonObject[];
    expect(data.length).toBeGreaterThan(0);
    const entity = data[0]!.entity as JsonObject;
    expect(entity.name).toBe("Diffbot");
    await db.close();
  });

  live("web search", async () => {
    const db = new Diffbot({ token });
    const result = await db.webSearch("diffbot knowledge graph", { numResults: 3 });
    const searchResults = result.search_results as JsonObject[];
    expect(searchResults.length).toBeGreaterThan(0);
    await db.close();
  });

  live("async extract via DiffbotAsync", async () => {
    await using db = new DiffbotAsync({ token });
    const result = await db.extract("https://example.com");
    const objects = result.objects as JsonObject[];
    expect(objects.length).toBeGreaterThan(0);
    expect(objects[0]).toHaveProperty("content");
  });

  live("async dql via DiffbotAsync", async () => {
    await using db = new DiffbotAsync({ token });
    const result = (await db.dql('type:Organization name:"Diffbot"', { size: 1 })) as JsonObject;
    const data = result.data as JsonObject[];
    expect(data.length).toBeGreaterThan(0);
  });

  live("async web search via DiffbotAsync", async () => {
    await using db = new DiffbotAsync({ token });
    const result = await db.webSearch("diffbot knowledge graph", { numResults: 3 });
    expect(result).toHaveProperty("search_results");
  });
});
