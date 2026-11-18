import { describe, expect, it } from "vitest";
import { DiffbotClient } from "../src/index.js";

describe("DiffbotClient per-host bases", () => {
  it("defaults every endpoint to the public hosts", () => {
    const db = new DiffbotClient({ token: "t" });
    expect(db.analyzeUrl).toBe("https://api.diffbot.com/v3");
    expect(db.crawlerUrl).toBe("https://api.diffbot.com/v3/crawl");
    expect(db.llmUrl).toBe("https://llm.diffbot.com/rag/v1/chat/completions");
    expect(db.webSearchUrl).toBe("https://llm.diffbot.com/api/v1/web_search");
    expect(db.nlpUrl).toBe("https://nl.diffbot.com/v1/");
    expect(db.dqlUrl).toBe("https://kg.diffbot.com/kg/v3/dql");
    expect(db.ontologyUrl).toBe("https://kg.diffbot.com/kg/ontology");
  });

  it("derives every api.diffbot.com endpoint from a single apiBase override", () => {
    const db = new DiffbotClient({ token: "t", apiBase: "https://staging.example.com" });
    expect(db.analyzeUrl).toBe("https://staging.example.com/v3");
    expect(db.crawlerUrl).toBe("https://staging.example.com/v3/crawl");
  });

  it("derives every kg.diffbot.com endpoint from a single kgBase override", () => {
    const db = new DiffbotClient({ token: "t", kgBase: "https://kg.staging.example.com" });
    expect(db.dqlUrl).toBe("https://kg.staging.example.com/kg/v3/dql");
    expect(db.ontologyUrl).toBe("https://kg.staging.example.com/kg/ontology");
  });

  it("derives every llm.diffbot.com endpoint from a single llmBase override", () => {
    const db = new DiffbotClient({ token: "t", llmBase: "https://llm.staging.example.com" });
    expect(db.llmUrl).toBe("https://llm.staging.example.com/rag/v1/chat/completions");
    expect(db.webSearchUrl).toBe("https://llm.staging.example.com/api/v1/web_search");
  });

  it("derives the NL endpoint from nlpBase", () => {
    const db = new DiffbotClient({ token: "t", nlpBase: "https://nl.staging.example.com" });
    expect(db.nlpUrl).toBe("https://nl.staging.example.com/v1/");
  });

  it("lets the legacy per-endpoint option win over a host base", () => {
    const db = new DiffbotClient({
      token: "t",
      apiBase: "https://staging.example.com",
      analyzeUrl: "https://custom.example.com/v3",
    });
    expect(db.analyzeUrl).toBe("https://custom.example.com/v3");
    expect(db.crawlerUrl).toBe("https://staging.example.com/v3/crawl");
  });
});
