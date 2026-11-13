import {
  API_BASE,
  DEFAULT_TIMEOUT,
  KG_BASE,
  LLM_BASE,
  NLP_HOST_BASE,
  VERSION,
} from "./constants.js";
import { ValidationError } from "./errors.js";
import { HttpClient, type FetchFn, type RetryPolicy } from "./http.js";

export interface DiffbotClientOptions {
  token: string;
  timeout?: number;
  /** `false` disables retries entirely; an object overrides individual defaults. */
  retry?: RetryPolicy | false;
  /** Base for `api.diffbot.com` endpoints (Extract, Crawl, Bulk, Custom API, Account). */
  apiBase?: string;
  /** Base for `kg.diffbot.com` endpoints (DQL, DQL reports, Enhance, ontology). */
  kgBase?: string;
  /** Base for `llm.diffbot.com` endpoints (Ask, Web Search). */
  llmBase?: string;
  /** Base for `nl.diffbot.com` (Natural Language). */
  nlpBase?: string;
  /** @deprecated prefer `apiBase`; wins over it when set. */
  analyzeUrl?: string;
  /** @deprecated prefer `llmBase`; wins over it when set. */
  llmUrl?: string;
  /** @deprecated prefer `apiBase`; wins over it when set. */
  crawlerUrl?: string;
  /** @deprecated prefer `llmBase`; wins over it when set. */
  webSearchUrl?: string;
  /** @deprecated prefer `nlpBase`; wins over it when set. */
  nlpUrl?: string;
  /** @deprecated prefer `kgBase`; wins over it when set. */
  dqlUrl?: string;
  /** @deprecated prefer `kgBase`; wins over it when set. */
  ontologyUrl?: string;
  fetch?: FetchFn;
}

export class DiffbotClient {
  readonly token: string;
  readonly apiBase: string;
  readonly kgBase: string;
  readonly llmBase: string;
  readonly nlpBase: string;
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

    this.apiBase = options.apiBase ?? API_BASE;
    this.kgBase = options.kgBase ?? KG_BASE;
    this.llmBase = options.llmBase ?? LLM_BASE;
    this.nlpBase = options.nlpBase ?? NLP_HOST_BASE;

    // This constructor is the one sanctioned reader of these deprecated aliases: it's
    // what makes them "win over" the matching base when set.
    /* eslint-disable @typescript-eslint/no-deprecated */
    this.analyzeUrl = options.analyzeUrl ?? `${this.apiBase}/v3`;
    this.crawlerUrl = options.crawlerUrl ?? `${this.apiBase}/v3/crawl`;
    this.llmUrl = options.llmUrl ?? `${this.llmBase}/rag/v1/chat/completions`;
    this.webSearchUrl = options.webSearchUrl ?? `${this.llmBase}/api/v1/web_search`;
    this.nlpUrl = options.nlpUrl ?? `${this.nlpBase}/v1/`;
    this.dqlUrl = options.dqlUrl ?? `${this.kgBase}/kg/v3/dql`;
    this.ontologyUrl = options.ontologyUrl ?? `${this.kgBase}/kg/ontology`;
    /* eslint-enable @typescript-eslint/no-deprecated */

    this.http = new HttpClient(
      options.fetch ?? fetch,
      options.timeout ?? DEFAULT_TIMEOUT,
      `diffbot-typescript/${VERSION}`,
      options.retry ?? {},
    );
  }

  async close(): Promise<void> {
    await this.http.close();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
