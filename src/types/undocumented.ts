/**
 * Types for surfaces this SDK ships that no Diffbot OpenAPI spec or docs page
 * describes: the ontology JSON document, the Ask/RAG endpoint, Extract's per-api
 * object shapes (the spec gives examples only, no response schema), and the
 * Crawl/Bulk job record (same — examples only, see `docs__crawl__create.md`).
 *
 * Every type here is weaker evidence than one generated from `src/generated/*`:
 * the server is free to change these fields without it being a documented
 * breaking change. Keep members optional and interfaces open (extending
 * `JsonObject`) so an unexpected field never produces a type error.
 */
import type { JsonObject } from "../json.js";

// ---- Ontology (kg.diffbot.com/kg/ontology — not a documented API operation) ----

export interface FieldMeta extends JsonObject {
  type?: string;
  isList?: boolean;
  isComposite?: boolean;
  isEnum?: boolean;
  isDeprecated?: boolean;
  leType?: string[];
}

export interface OntologyTypeDef extends JsonObject {
  fields?: Record<string, FieldMeta>;
}

export interface TaxonomyNode extends JsonObject {
  name?: string;
  children?: TaxonomyNode[];
}

export interface Taxonomy extends JsonObject {
  categories?: TaxonomyNode[];
}

export interface OntologyEnum extends JsonObject {
  values?: string[];
}

export interface OntologyDocument extends JsonObject {
  types?: Record<string, OntologyTypeDef>;
  composites?: Record<string, OntologyTypeDef>;
  enums?: Record<string, OntologyEnum>;
  taxonomies?: Record<string, Taxonomy>;
}

// ---- Ask / RAG (llm.diffbot.com/rag/v1/chat/completions — undocumented) ----

export type ChatRole = "system" | "user" | "assistant";

export interface ChatCompletionRequest extends JsonObject {
  model: string;
  messages: Array<{ role: ChatRole; content: string }>;
  stream?: boolean;
  response_format?: JsonObject;
}

export interface ChatCompletionChunk extends JsonObject {
  choices?: Array<{ delta?: { content?: string } }>;
}

// ---- Crawl / Bulk job record (crawl.json/bulk.json document examples only) ----

export interface JobStatus extends JsonObject {
  status?: number;
  message?: string;
}

export interface CrawlJob extends JsonObject {
  name?: string;
  jobStatus?: JobStatus;
  type?: string;
  seeds?: string[];
  roundsCompleted?: number;
  pageCrawlAttempts?: number;
  pageCrawlSuccesses?: number;
  pageCrawlSuccessesThisRound?: number;
  pagesInQueue?: number;
  downloadJson?: string;
  downloadUrls?: string;
}

// ---- Extract (extract.json documents examples only, no response schema) ----

export interface ExtractResponse<T extends JsonObject = JsonObject> extends JsonObject {
  request?: JsonObject;
  objects?: T[];
  humanLanguage?: string;
  errorCode?: number;
  error?: string;
}

interface DiffbotObjectBase extends JsonObject {
  type?: string;
  title?: string;
  pageUrl?: string;
  diffbotUri?: string;
}

export type AnalyzeObject = DiffbotObjectBase;

export interface ArticleObject extends DiffbotObjectBase {
  text?: string;
  html?: string;
  author?: string;
  date?: string;
  tags?: Array<{ label?: string; score?: number }>;
}

export interface ProductObject extends DiffbotObjectBase {
  offerPrice?: string;
  regularPrice?: string;
  availability?: boolean;
  productId?: string;
}

export interface DiscussionObject extends DiffbotObjectBase {
  text?: string;
  posts?: JsonObject[];
}

export type JobObject = DiffbotObjectBase;

export interface ImageObject extends DiffbotObjectBase {
  naturalHeight?: number;
  naturalWidth?: number;
}

export interface VideoObject extends DiffbotObjectBase {
  duration?: number;
}

export interface ListObject extends DiffbotObjectBase {
  items?: JsonObject[];
}

export interface EventObject extends DiffbotObjectBase {
  startDate?: string;
  endDate?: string;
}

/** A Custom API's object shape is caller-defined; keep it open by design. */
export type CustomApiObject = JsonObject;
