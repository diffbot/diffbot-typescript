export const VERSION = "0.6.0";

export const DEFAULT_TIMEOUT = 30_000;

/** Per-host base URLs. Overridable via `apiBase`/`kgBase`/`llmBase`/`nlpBase`; the
 * older per-endpoint `*Url` options still win over these when set. */
export const API_BASE = "https://api.diffbot.com";
export const KG_BASE = "https://kg.diffbot.com";
export const LLM_BASE = "https://llm.diffbot.com";
export const NLP_HOST_BASE = "https://nl.diffbot.com";

export const EXTRACT_BASE = `${API_BASE}/v3`;
export const CRAWL_BASE = `${API_BASE}/v3/crawl`;
export const DIFFBOT_LLM_BASE = `${LLM_BASE}/rag/v1/chat/completions`;
export const WEB_SEARCH_BASE = `${LLM_BASE}/api/v1/web_search`;
export const NLP_BASE = `${NLP_HOST_BASE}/v1/`;
export const KG_DQL_ENDPOINT = `${KG_BASE}/kg/v3/dql`;
export const KG_ONTOLOGY_ENDPOINT = `${KG_BASE}/kg/ontology`;

export const TOKEN_ENV_VAR = "DIFFBOT_API_TOKEN";
