/*
  Live integration tests against the real Diffbot APIs. Skipped unless a token is
  resolvable via DIFFBOT_API_TOKEN or ~/.diffbot/credentials. Run with
  `pnpm test:live`.
*/

import { describe, expect, it } from "vitest";
import { DiffbotClient, ask, dql, extract, resolveToken, webSearch } from "../src/index.js";
import type { JsonObject } from "../src/json.js";

const token = resolveToken();
const live = token ? it : it.skip;

describe("live", () => {
  live("extract", async () => {
    const db = new DiffbotClient({ token });
    const result = await extract(db, "https://example.com");
    const objects = result.objects as JsonObject[];
    expect(objects.length).toBeGreaterThan(0);
    expect(objects[0]).toHaveProperty("content");
    await db.close();
  });

  live("ask streams content", async () => {
    const db = new DiffbotClient({ token });
    const chunks: string[] = [];
    for await (const chunk of ask(db, [{ role: "user", content: "What is Diffbot?" }])) {
      chunks.push(chunk);
    }
    expect(chunks.join("").length).toBeGreaterThan(0);
    await db.close();
  });

  live("dql", async () => {
    const db = new DiffbotClient({ token });
    const result = (await dql(db, 'type:Organization name:"Diffbot"', { size: 1 })) as JsonObject;
    const data = result.data as JsonObject[];
    expect(data.length).toBeGreaterThan(0);
    const entity = data[0]!.entity as JsonObject;
    expect(entity.name).toBe("Diffbot");
    await db.close();
  });

  live("web search", async () => {
    const db = new DiffbotClient({ token });
    const result = await webSearch(db, "diffbot knowledge graph", { numResults: 3 });
    const searchResults = result.search_results as JsonObject[];
    expect(searchResults.length).toBeGreaterThan(0);
    await db.close();
  });

  live("disposal via await using", async () => {
    await using db = new DiffbotClient({ token });
    const result = await extract(db, "https://example.com");
    const objects = result.objects as JsonObject[];
    expect(objects.length).toBeGreaterThan(0);
    expect(objects[0]).toHaveProperty("content");
  });
});
