import {
  CRAWL_BASE,
  DEFAULT_TIMEOUT,
  DIFFBOT_LLM_BASE,
  EXTRACT_BASE,
  KG_DQL_ENDPOINT,
  KG_ONTOLOGY_ENDPOINT,
  NLP_BASE,
  VERSION,
  WEB_SEARCH_BASE,
} from "./constants.js";
import { ValidationError } from "./errors.js";
import { HttpClient, type FetchFn } from "./http.js";

export interface DiffbotClientOptions {
  token: string;
  timeout?: number;
  analyzeUrl?: string;
  llmUrl?: string;
  crawlerUrl?: string;
  webSearchUrl?: string;
  nlpUrl?: string;
  dqlUrl?: string;
  ontologyUrl?: string;
  fetch?: FetchFn;
}

export class DiffbotClient {
  readonly token: string;
  readonly analyzeUrl: string;
  readonly llmUrl: string;
  readonly crawlerUrl: string;
  readonly webSearchUrl: string;
  readonly nlpUrl: string;
  readonly dqlUrl: string;
  readonly ontologyUrl: string;
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
    this.dqlUrl = options.dqlUrl ?? KG_DQL_ENDPOINT;
    this.ontologyUrl = options.ontologyUrl ?? KG_ONTOLOGY_ENDPOINT;
    this.http = new HttpClient(
      options.fetch ?? fetch,
      options.timeout ?? DEFAULT_TIMEOUT,
      `diffbot-typescript/${VERSION}`,
    );
  }

  async close(): Promise<void> {
    await this.http.close();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
