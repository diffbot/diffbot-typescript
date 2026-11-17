import { describe, expect, it } from "vitest";
import {
  CrawlEventType,
  DiffbotClient,
  account,
  ask,
  crawl,
  crawlDownload,
  crawlGetJob,
  dql,
  entities,
  extract,
  verifyToken,
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

  it("extract with options", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.url).toBe("https://api.diffbot.com/v3/article");
        expect(req.params.get("fields")).toBe("links,meta");
        expect(req.params.get("timeout")).toBe("60000");
        expect(req.params.get("naturalLanguage")).toBe("entities,sentiment");
        return jsonResponse({ objects: [{ title: "T" }] });
      }),
    });
    const article = await extract(db, "https://www.example.com", "article", "json", {
      fields: ["links", "meta"],
      timeout: 60_000,
      naturalLanguage: ["entities", "sentiment"],
    });
    expect(article.objects).toHaveLength(1);
  });

  it("verifyToken and account", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.url).toBe("https://api.diffbot.com/v4/account");
        return jsonResponse({ plan: "free", usage: [] });
      }),
    });
    expect(await verifyToken(db)).toBe(true);
    const { plan, usage } = await account(db, { days: 7 });
    expect(plan).toBe("free");
    expect(usage).toEqual([]);
  });

  it("crawl without watch, then crawlGetJob and crawlDownload", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        if (req.url.endsWith("/crawl/data")) {
          return req.params.get("format") === "csv"
            ? new Response("pageUrl\nhttps://example.com/\n")
            : jsonResponse([{ pageUrl: "https://example.com/" }]);
        }
        return jsonResponse({ jobs: [{ name: "my-job", jobStatus: { status: 9 } }] });
      }),
    });
    for await (const _ of crawl(db, "https://www.example.com", { jobName: "my-job" })) {
      void _;
    }
    const job = await crawlGetJob(db, "my-job");
    expect(job?.jobStatus?.status).toBe(9);
    const records = await crawlDownload(db, "my-job");
    expect(records).toEqual([{ pageUrl: "https://example.com/" }]);
    expect(await crawlDownload(db, "my-job", { format: "csv" })).toContain("pageUrl");
  });

  it("dql", async () => {
    const db = new DiffbotClient({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.method).toBe("POST");
        expect(req.body).toContain("Diffbot");
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

  it("apiBase points every api.diffbot.com endpoint at a staging host", async () => {
    const staging = new DiffbotClient({
      token: "test-token",
      apiBase: "https://staging.example.com",
      fetch: createMockFetch((req) => {
        expect(req.url).toBe("https://staging.example.com/v3/analyze");
        return jsonResponse({ objects: [] });
      }),
    });
    await extract(staging, "https://news.ycombinator.com");
  });

  it("retry: false disables retries", async () => {
    let calls = 0;
    const db = new DiffbotClient({
      token: "test-token",
      retry: false,
      fetch: createMockFetch(() => {
        calls++;
        return new Response("", { status: 503 });
      }),
    });
    await expect(dql(db, "type:Organization")).rejects.toMatchObject({ statusCode: 503 });
    expect(calls).toBe(1);
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
