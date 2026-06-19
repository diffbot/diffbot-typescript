export type JsonObject = Record<string, unknown>;
export type FetchFn = typeof fetch;

export interface ChatMessage {
  role: string;
  content: string;
}

export interface DiffbotClientOptions {
  token: string;
  timeout?: number;
  analyzeUrl?: string;
  llmUrl?: string;
  crawlerUrl?: string;
  webSearchUrl?: string;
  nlpUrl?: string;
  fetch?: FetchFn;
}

export interface DiffbotClientLike {
  token: string;
  analyzeUrl: string;
  llmUrl: string;
  crawlerUrl: string;
  webSearchUrl: string;
  nlpUrl: string;
  http: HttpClientLike;
  raiseForStatus(response: Response, bodyText?: string): void;
}

export interface HttpClientLike {
  get(url: string, options?: HttpRequestOptions): Promise<Response>;
  post(url: string, options?: HttpRequestOptions): Promise<Response>;
  close(): Promise<void>;
  isClosed: boolean;
}

export interface HttpRequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  json?: unknown;
  redirect?: "follow" | "error" | "manual";
}

export interface DqlOptions {
  size?: number;
  from?: number;
  format?: string;
  filter?: string;
  exportspec?: string;
  extra?: Record<string, string>;
  raw?: boolean;
}

export interface CrawlOptions {
  hops?: number;
  jobName?: string;
  maxToCrawl?: number;
  maxToProcess?: number;
  restrictDomain?: boolean;
  apiUrl?: string;
  crawlDelay?: number;
  urlCrawlPattern?: string;
  urlProcessPattern?: string;
  obeyRobots?: boolean;
  useProxies?: boolean;
  customHeaders?: string;
  watch?: boolean;
  pollInterval?: number;
}
