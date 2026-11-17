/*
  Live integration tests against the real Diffbot APIs. Skipped unless a token is
  resolvable via DIFFBOT_API_TOKEN or ~/.diffbot/credentials. Run with
  `pnpm test:live`.
*/

import { describe, expect, it } from "vitest";
import {
  DiffbotClient,
  account,
  ask,
  askJson,
  crawlDeleteJob,
  crawlDownload,
  crawlGetJob,
  crawlListJobs,
  crawl,
  dql,
  entities,
  extract,
  jsonSchemaFormat,
  nlp,
  verifyToken,
  webSearch,
} from "../src/index.js";
import { resolveToken } from "../src/node/index.js";
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

  live("ask streams with responseFormat", async () => {
    const db = new DiffbotClient({ token });
    const schema = {
      type: "object",
      properties: { country: { type: "string" }, capital: { type: "string" } },
      required: ["country", "capital"],
    };
    let text = "";
    for await (const chunk of ask(db, [{ role: "user", content: "What is the capital of France?" }], {
      responseFormat: jsonSchemaFormat(schema),
    })) {
      text += chunk;
    }
    expect(text.toLowerCase()).toContain("paris");
    await db.close();
  });

  live("askJson nested schema", async () => {
    const db = new DiffbotClient({ token });
    const schema = {
      type: "object",
      properties: {
        company: {
          type: "object",
          properties: { name: { type: "string" }, founded: { type: "integer" } },
          required: ["name"],
        },
        products: { type: "array", items: { type: "string" } },
      },
      required: ["company", "products"],
    };
    const result = await askJson<{ company: { name: string }; products: string[] }>(
      db,
      [{ role: "user", content: "Tell me about Diffbot the company." }],
      schema,
    );
    expect(result.company.name.toLowerCase()).toContain("diffbot");
    expect(Array.isArray(result.products)).toBe(true);
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

  // DQL is sent as POST (JSON body). Kept cheap: size 0 is a hit count, others size 1.
  live("dql POST: size 0 hit count", async () => {
    await using db = new DiffbotClient({ token });
    const result = await dql(db, "type:Organization", { size: 0 });
    expect(typeof result.hits).toBe("number");
  });

  live("dql POST: csv returns text", async () => {
    await using db = new DiffbotClient({ token });
    const csv = await dql(db, 'type:Organization name:"Diffbot"', { size: 1, format: "csv" });
    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);
  });

  live("dql POST: jsonl streams entities", async () => {
    await using db = new DiffbotClient({ token });
    const items: unknown[] = [];
    for await (const item of await dql(db, 'type:Organization name:"Diffbot"', { size: 1, format: "jsonl" })) {
      items.push(item);
    }
    expect(items.length).toBeGreaterThan(0);
  });

  live("dql POST: a query over 8 KB is accepted (no URL length limit)", async () => {
    await using db = new DiffbotClient({ token });
    const clauses = Array.from({ length: 400 }, (_, i) => `name:"Acme Widget Company ${i}"`);
    const query = `type:Organization or(${clauses.join(",")})`;
    expect(query.length).toBeGreaterThan(8 * 1024);
    const result = await dql(db, query, { size: 0 });
    expect(typeof result.hits).toBe("number");
  });

  live("entities", async () => {
    await using db = new DiffbotClient({ token });
    const result = await entities(db, "Tim Cook is the CEO of Apple, based in Cupertino.");
    expect(Array.isArray(result.entities)).toBe(true);
    expect(result.entities?.length ?? 0).toBeGreaterThan(0);
  });

  // The account body contains `token` and `childTokens`: assert on shape only and never
  // put the body (or those fields) in an assertion message.
  live("account + verifyToken (free)", async () => {
    await using db = new DiffbotClient({ token });
    const body = await account(db, { days: 1 });
    expect(typeof body.status).toBe("string");
    expect(Array.isArray(body.usage)).toBe(true);
    expect(await verifyToken(db)).toBe(true);
    await using bad = new DiffbotClient({ token: "invalid-token-for-live-test" });
    expect(await verifyToken(bad)).toBe(false);
  });

  live("extract with fields and a caller timeout", async () => {
    await using db = new DiffbotClient({ token });
    const result = await extract(db, "https://example.com", "article", "json", {
      fields: ["links"],
      timeout: 45_000,
    });
    expect(Array.isArray(result.objects)).toBe(true);
    expect(result.objects?.length ?? 0).toBeGreaterThan(0);
  });

  live("tiny crawl -> poll -> crawlDownload csv/json -> delete", async () => {
    const prefix = "sdk-live-ts-";
    await using db = new DiffbotClient({ token });
    // Leaked-job check: anything from a prior run of this suite older than 1 h is deleted.
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const job of await crawlListJobs(db)) {
      const created = Number(job.name?.slice(prefix.length));
      if (job.name?.startsWith(prefix) && Number.isFinite(created) && created < cutoff) {
        await crawlDeleteJob(db, job.name);
      }
    }
    const name = `${prefix}${Date.now().toString()}`;
    try {
      for await (const _ of crawl(db, "https://example.com", {
        jobName: name,
        maxToCrawl: 5,
        maxToProcess: 5,
        hops: 0,
      })) {
        void _;
      }
      let status = 0;
      for (let i = 0; i < 40; i++) {
        const job = await crawlGetJob(db, name);
        status = job?.jobStatus?.status ?? 0;
        if (status !== 0 && status !== 7) break;
        await new Promise((r) => setTimeout(r, 3_000));
      }
      expect(status).not.toBe(0);
      const csv = await crawlDownload(db, name, { format: "csv" });
      expect(typeof csv).toBe("string");
      const records = await crawlDownload(db, name);
      expect(Array.isArray(records)).toBe(true);
    } finally {
      await crawlDeleteJob(db, name);
    }
  }, 180_000);

  live("web search", async () => {
    const db = new DiffbotClient({ token });
    const result = await webSearch(db, "diffbot knowledge graph", { numResults: 3 });
    const searchResults = result.search_results as JsonObject[];
    expect(searchResults.length).toBeGreaterThan(0);
    await db.close();
  });

  // S2: assert on shape only, never on web content.
  live("web search: numResults 1, single and 2-value text", async () => {
    const db = new DiffbotClient({ token });
    const one = await webSearch(db, "diffbot knowledge graph", { numResults: 1 });
    expect(Array.isArray(one.search_results)).toBe(true);
    const two = await webSearch(db, ["diffbot knowledge graph", "diffbot extract api"], { numResults: 1 });
    expect(Array.isArray(two.search_results)).toBe(true);
    await db.close();
  });

  live("entities and nlp on one sentence", async () => {
    await using db = new DiffbotClient({ token });
    const sentence = "Tim Cook is the CEO of Apple, based in Cupertino.";
    const viaEntities = await entities(db, sentence);
    expect(Array.isArray(viaEntities.entities)).toBe(true);
    const viaNlp = await nlp(db, sentence, { fields: ["entities", "language"] });
    expect(Array.isArray(viaNlp.entities)).toBe(true);
    expect(typeof viaNlp.language).toBe("string");
  });

  live("web search snippetLength", async () => {
    const db = new DiffbotClient({ token });
    const total = (r: JsonObject) =>
      (r.search_results as JsonObject[]).reduce((n, x) => n + String(x.content ?? "").length, 0);
    const long = await webSearch(db, "diffbot knowledge graph", { numResults: 3 });
    const short = await webSearch(db, "diffbot knowledge graph", { numResults: 3, snippetLength: "short" });
    expect((short.search_results as JsonObject[]).length).toBeGreaterThan(0);
    expect(total(short)).toBeLessThanOrEqual(total(long));
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
