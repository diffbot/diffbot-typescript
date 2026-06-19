import {
  CRAWL_BASE,
  DEFAULT_TIMEOUT,
  DIFFBOT_LLM_BASE,
  EXTRACT_BASE,
  NLP_BASE,
  VERSION,
  WEB_SEARCH_BASE,
} from "./constants.js";
import { ValidationError } from "./errors.js";
import { HttpClient, raiseForStatus } from "./http.js";
import { extract } from "./extract.js";
import { ask } from "./ask.js";
import {
  crawl,
  crawlDeleteJob,
  crawlGetJob,
  crawlListJobs,
  type CrawlEvent,
  CrawlEventType,
} from "./crawl.js";
import {
  dql,
  dqlFetchOntology,
  dqlParallel,
  dqlRefreshOntology,
} from "./kg.js";
import { entities } from "./nlp.js";
import { Ontology } from "./ontology.js";
import { webSearch } from "./web-search.js";
import type {
  ChatMessage,
  CrawlOptions,
  DiffbotClientOptions,
  DqlOptions,
  FetchFn,
  JsonObject,
} from "./types.js";

export { CrawlEventType, type CrawlEvent };

class DiffbotBase {
  readonly token: string;
  readonly analyzeUrl: string;
  readonly llmUrl: string;
  readonly crawlerUrl: string;
  readonly webSearchUrl: string;
  readonly nlpUrl: string;
  readonly http: HttpClient;

  constructor(options: DiffbotClientOptions) {
    if (!options.token) {
      throw new ValidationError("token is required");
    }
    this.token = options.token;
    this.analyzeUrl = options.analyzeUrl ?? EXTRACT_BASE;
    this.llmUrl = options.llmUrl ?? DIFFBOT_LLM_BASE;
    this.crawlerUrl = options.crawlerUrl ?? CRAWL_BASE;
    this.webSearchUrl = options.webSearchUrl ?? WEB_SEARCH_BASE;
    this.nlpUrl = options.nlpUrl ?? NLP_BASE;
    this.http = new HttpClient(
      options.fetch ?? fetch,
      options.timeout ?? DEFAULT_TIMEOUT,
      `diffbot-typescript/${VERSION}`,
    );
  }

  raiseForStatus(response: Response, bodyText?: string): void {
    raiseForStatus(response, bodyText);
  }

  async close(): Promise<void> {
    await this.http.close();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }

  async extract(url: string, api = "analyze", fmt = "markdown"): Promise<JsonObject> {
    return extract(this, url, api, fmt);
  }

  ask(messages: ChatMessage[]): AsyncGenerator<string> {
    return ask(this, messages);
  }

  crawl(site: string, options?: CrawlOptions): AsyncGenerator<CrawlEvent> {
    return crawl(this, site, options);
  }

  async crawlListJobs(): Promise<JsonObject[]> {
    return crawlListJobs(this);
  }

  async crawlGetJob(jobName: string): Promise<JsonObject> {
    return crawlGetJob(this, jobName);
  }

  async crawlDeleteJob(jobName: string): Promise<void> {
    return crawlDeleteJob(this, jobName);
  }

  async dql(query: string, options: DqlOptions = {}): Promise<JsonObject | Uint8Array> {
    return dql(this, query, options);
  }

  async dqlParallel(
    queries: Array<DqlOptions & { query: string }>,
    options: { workers?: number } = {},
  ): Promise<Array<JsonObject | Uint8Array>> {
    return dqlParallel(this, queries, options.workers ?? 8);
  }

  async dqlRefreshOntology(dest: string): Promise<void> {
    return dqlRefreshOntology(this, dest);
  }

  async dqlFetchOntology(): Promise<Ontology> {
    return dqlFetchOntology(this);
  }

  async webSearch(
    text: string,
    options: { numResults?: number; maxTokens?: number } = {},
  ): Promise<JsonObject> {
    return webSearch(this, text, options);
  }

  async entities(text: string, options: { lang?: string } = {}): Promise<JsonObject> {
    return entities(this, text, options.lang ?? "auto");
  }
}

/** Async client for Diffbot APIs. */
export class Diffbot extends DiffbotBase {}

/** Alias for API parity with the Python SDK. */
export class DiffbotAsync extends DiffbotBase {}
