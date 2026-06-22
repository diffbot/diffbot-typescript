import { describe, expect, it } from "vitest";
import {
  CrawlEventType,
  DiffbotClient,
  ask,
  crawl,
  dql,
  entities,
  extract,
  webSearch,
} from "../src/index.js";
import { createMockFetch, jsonResponse, sseResponse } from "./helpers/mock-fetch.js";

const SSE_PARIS = 'data: {"choices": [{"delta": {"content": "Paris"}}]}\n';

describe("README examples", () => {
  it("extract", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.params.get("token")).toBe("test-token");
        expect(req.params.get("url")).toBe("https://news.ycombinator.com");
        return jsonResponse({ objects: [{ title: "Hacker News" }] });
      }),
    });
    const data = await extract(db, "https://news.ycombinator.com");
    expect(data).toHaveProperty("objects");
  });

  it("ask", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch(() => sseResponse(SSE_PARIS)),
    });
    const chunks: string[] = [];
    for await (const chunk of ask(db, [{ role: "user", content: "What's the capital of France?" }])) {
      chunks.push(chunk);
    }
    expect(chunks.join("")).toContain("Paris");
  });

  it("crawl", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch(() => jsonResponse({ jobs: [{ name: "test-job" }] })),
    });
    const events = [];
    for await (const event of crawl(db, "https://example.com", { hops: 1, jobName: "test-job" })) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe(CrawlEventType.JobCreated);
  });

  it("dql", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.params.get("query")).toContain("Diffbot");
        return jsonResponse({ data: [{ entity: { name: "Diffbot" } }] });
      }),
    });
    const results = await dql(db, 'type:Organization name:"Diffbot"');
    expect(results).toHaveProperty("data");
  });

  it("web search", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.headers.get("Authorization")).toBe("Bearer test-token");
        expect(req.params.get("text")).toBe("diffbot knowledge graph");
        return jsonResponse({
          query: ["diffbot knowledge graph"],
          search_results: [{ score: 0.95, title: "Diffbot", pageUrl: "https://diffbot.com", content: "AI-powered web data." }],
          timeMs: 10,
        });
      }),
    });
    const results = await webSearch(db, "diffbot knowledge graph");
    const searchResults = results.search_results as Array<Record<string, unknown>>;
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0]!.title).toBe("Diffbot");
  });

  it("entities", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.method).toBe("POST");
        expect(req.params.get("token")).toBe("test-token");
        expect(req.params.get("fields")).toContain("entities");
        return jsonResponse([
          {
            entities: [
              { name: "Apple" },
              { name: "Tim Cook" },
            ],
            sentiment: 0.3,
          },
        ]);
      }),
    });
    const result = await entities(db, "Apple CEO Tim Cook announced record quarterly earnings.");
    const entityList = result.entities as Array<Record<string, unknown>>;
    expect(entityList).toHaveLength(2);
    expect(result.sentiment).toBe(0.3);
  });

  it("extract with await using", async () => {
    await using db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch(() => jsonResponse({ objects: [{ title: "Hacker News" }] })),
    });
    const data = await extract(db, "https://news.ycombinator.com");
    expect(data).toHaveProperty("objects");
  });
});
