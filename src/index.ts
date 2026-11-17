export { DiffbotClient, type DiffbotClientOptions } from "./client.js";
export { resolveTokenFromEnv, type TokenSource } from "./auth.js";
export { account, verifyToken, type AccountOptions } from "./account.js";
export { extract } from "./extract.js";
export {
  ANY_OBJECT_SCHEMA,
  RESPONSE_FORMAT_TYPES,
  ask,
  askJson,
  extractJson,
  jsonSchemaFormat,
  type AskJsonOptions,
  type AskOptions,
  type ChatMessage,
  type ChatRole,
  type ResponseFormat,
  type ResponseFormatType,
} from "./ask.js";
export {
  crawl,
  crawlDeleteJob,
  crawlGetJob,
  crawlListJobs,
  CrawlEventType,
  type CrawlEvent,
  type CrawlOptions,
} from "./crawl.js";
export {
  dql,
  dqlFetchOntology,
  dqlFetchOntologyText,
  dqlParallel,
  type DqlOptions,
} from "./kg.js";
export { entities, type EntitiesResponse } from "./nlp.js";
export { Ontology } from "./ontology.js";
export {
  OntologyStore,
  KVOntologyStore,
  type OntologyStoreOptions,
  type KVOntologyStoreOptions,
  type KVLike,
} from "./ontology-store.js";
export { webSearch, SNIPPET_LENGTHS, type SnippetLength, type WebSearchOptions } from "./web-search.js";
export {
  DiffbotError,
  ValidationError,
  APIError,
  AuthError,
  NotFoundError,
  RateLimitError,
  JobError,
  ExtractionError,
} from "./errors.js";
export { VERSION } from "./constants.js";
export type { FetchFn, QueryParams, RetryPolicy } from "./http.js";
export type { JsonObject } from "./json.js";

// Response/shared types (generated-backed where a spec defines a schema; hand-written
// in src/types/undocumented.ts otherwise — see that file's header for which is which).
export type { DqlEntity, DqlResponse, DqlRewrite, ExportFormat } from "./types/dql.js";
export type { AccountResponse, AccountUsage } from "./types/account.js";
export type { NaturalLanguageResponse, NlpDocument, NlpField } from "./types/natural-language.js";
export type { WebSearchResponse, WebSearchResult } from "./types/web-search.js";
export type {
  AnalyzeObject,
  ArticleObject,
  CrawlJob,
  CustomApiObject,
  DiscussionObject,
  EventObject,
  ExtractResponse,
  FieldMeta,
  ImageObject,
  JobObject,
  JobStatus,
  ListObject,
  OntologyDocument,
  ProductObject,
  VideoObject,
} from "./types/undocumented.js";
