# Diffbot TypeScript Library

TypeScript client library for [Diffbot](https://www.diffbot.com) APIs. This is a port of the [diffbot-python](https://github.com/diffbot/diffbot-python) public library API.

## Installation

```bash
pnpm add @diffbot/typescript
```

Requires Node.js 18+ (native `fetch`) to build and install. The main entry point itself
runs anywhere `fetch` exists, including Cloudflare Workers with no compatibility flags —
see [Cloudflare Workers](#cloudflare-workers) below.

## Usage

In TypeScript, all API functions are async. Use `await` or `for await` where the Python SDK used sync iteration.

Create a client once, then pass it to the API functions you need. Import only the functions you use so bundlers can tree-shake unused code.

### Authentication

```typescript
import { DiffbotClient, extract, resolveTokenFromEnv } from "@diffbot/typescript";

const db = new DiffbotClient({ token: resolveTokenFromEnv() });
const data = await extract(db, "https://www.example.com");
await db.close();
```

Token resolution order:

1. Explicit argument to `resolveTokenFromEnv(token)`
2. An `env`-style object passed as the second argument — the Workers convention: `resolveTokenFromEnv(undefined, env)`
3. `DIFFBOT_API_TOKEN` environment variable (`process.env`)

Node users who want a `~/.diffbot/credentials` file as a final fallback should import
`resolveToken` from `@diffbot/typescript/node` instead — same first three steps, plus the
file. See [Runtime support](#runtime-support-node-vs-everywhere-else).

### Client configuration

`DiffbotClient` is the single place to configure the SDK — every API function takes its
settings from the client you hand it.

| Option | Default | Used by |
|--------|---------|---------|
| `token` | — (required) | all |
| `timeout` | `30000` (ms) | all; overridable per call (see below) |
| `retry` | on, 3 attempts | all; `false` disables, or pass a `RetryPolicy` to tune it |
| `fetch` | global `fetch` | all |
| `apiBase` | `https://api.diffbot.com` | `extract`, `account`, `verifyToken`, `crawl`, `crawlListJobs`, `crawlGetJob`, `crawlDownload`, `crawlDeleteJob` |
| `kgBase` | `https://kg.diffbot.com` | `dql`, `dqlParallel`, `dqlFetchOntology`, `dqlFetchOntologyText`, `OntologyStore` |
| `llmBase` | `https://llm.diffbot.com` | `ask`, `askJson`, `webSearch` |
| `nlpBase` | `https://nl.diffbot.com` | `entities` |
| `analyzeUrl` | derived from `apiBase` | `extract` |
| `crawlerUrl` | derived from `apiBase` | `crawl`, `crawlListJobs`, `crawlGetJob`, `crawlDeleteJob` |
| `llmUrl` | derived from `llmBase` | `ask`, `askJson` |
| `webSearchUrl` | derived from `llmBase` | `webSearch` |
| `nlpUrl` | derived from `nlpBase` | `entities` |
| `dqlUrl` | derived from `kgBase` | `dql`, `dqlParallel` |
| `ontologyUrl` | derived from `kgBase` | `dqlFetchOntology`, `dqlFetchOntologyText`, `OntologyStore` |

```typescript
import { DiffbotClient } from "@diffbot/typescript";

const db = new DiffbotClient({
  token: "YOUR_TOKEN",
  timeout: 60_000,
  dqlUrl: "http://localhost:8080/kg/v3/dql",
});
```

Point the whole SDK at a staging environment with one option instead of one per endpoint:

```typescript
const staging = new DiffbotClient({ token: "YOUR_TOKEN", apiBase: "https://staging.example.com" });
```

`apiBase`/`kgBase`/`llmBase`/`nlpBase` set the host for every endpoint on that host at
once. The older per-endpoint options (`analyzeUrl`, `crawlerUrl`, `llmUrl`,
`webSearchUrl`, `nlpUrl`, `dqlUrl`, `ontologyUrl`) still work and win over the matching
base when both are set; `analyzeUrl` and `crawlerUrl` are bases the SDK appends to
(`/${api}` and `/data` respectively), the rest are complete endpoints used as given.

Requests retry `429` and `5xx` responses (and connection errors) with backoff and
jitter, honoring a `Retry-After` header, by default. Disable retries or tune the policy:

```typescript
const db = new DiffbotClient({ token: "YOUR_TOKEN", retry: false });
// or: retry: { maxAttempts: 5 }
```

The transport also accepts a per-call `timeout` (ms) override and a `retryable: false`
escape hatch; the SDK uses the latter internally for `crawlDeleteJob`, a GET-shaped
mutation that must not be retried blindly.

Passing `fetch` replaces the transport, which is the hook for retries, logging, extra
headers, or mocking in tests:

```typescript
const db = new DiffbotClient({
  token: "YOUR_TOKEN",
  fetch: async (input, init) => {
    console.log("→", input); // the SDK always calls fetch with a URL string
    return fetch(input, init);
  },
});
```

### Extract structured content

```typescript
import { DiffbotClient, extract } from "@diffbot/typescript";

const db = new DiffbotClient({ token: "YOUR_TOKEN" });
const data = await extract(db, "https://www.example.com");
```

Pass an optional options object as the fifth argument (use `undefined` to keep the
defaults for `api` and `fmt`). `timeout` is the server-side limit in ms (default 30000);
the SDK keeps its own request timeout at least 10 s above it.

```typescript
const article = await extract(db, "https://www.example.com", "article", "json", {
  fields: ["links", "meta"],
  timeout: 60_000,
  naturalLanguage: ["entities", "sentiment"],
});
```

### Check a token and read account usage

`verifyToken()` is `true` for an accepted token and `false` only when the API rejects it
(`AuthError`); network errors, rate limits and 5xx responses are thrown. The account
response contains your token and any child tokens, so don't log it.

```typescript
import { account, verifyToken } from "@diffbot/typescript";

if (await verifyToken(db)) {
  const { plan, usage } = await account(db, { days: 7 });
}
```

### Ask Diffbot LLM

```typescript
import { ask } from "@diffbot/typescript";

for await (const chunk of ask(db, [{ role: "user", content: "What's the capital of France?" }])) {
  process.stdout.write(chunk);
}
```

### Structured output

Pass a JSON Schema to constrain the answer. The model is held to the schema by a grammar
during decoding, so the result parses reliably even though the answer is retrieved live
from the web.

```typescript
import { askJson } from "@diffbot/typescript";

const schema = {
  type: "object",
  properties: { country: { type: "string" }, capital: { type: "string" } },
  required: ["country", "capital"],
};
const answer = await askJson<{ country: string; capital: string }>(
  db,
  [{ role: "user", content: "What's the capital of France?" }],
  schema,
);
console.log(answer.capital);
```

Omit the schema to let the model choose the shape, or use `ask` with `responseFormat` to
stream a constrained answer:

```typescript
import { ask, askJson, jsonSchemaFormat } from "@diffbot/typescript";

const answer = await askJson(db, [{ role: "user", content: "What's the capital of France?" }]);

for await (const chunk of ask(db, [{ role: "user", content: "What's the capital of France?" }], {
  responseFormat: jsonSchemaFormat(schema),
})) {
  process.stdout.write(chunk);
}
```

> **Avoid `responseFormat: { type: "json_object" }`.** The endpoint accepts it, but applies
> no grammar to it: the RAG loop's internal tool call is itself a JSON object, so it can be
> returned as the final answer. This is reproducible whenever the request includes a system
> message. `askJson` therefore defaults to a permissive JSON Schema instead, and throws
> `ValidationError` if it ever sees a tool call come back.

### Crawl a site

```typescript
import { crawl } from "@diffbot/typescript";

for await (const event of crawl(db, "https://www.example.com", { hops: 1 })) {
  console.log(event);
}
```

To start a crawl without holding a connection open (for example inside a tool call),
start it without `watch`, poll the job, then download the results:

```typescript
import { crawl, crawlDownload, crawlGetJob } from "@diffbot/typescript";

for await (const _ of crawl(db, "https://www.example.com", { jobName: "my-job" })) {
  // yields a single job_created event when `watch` is off
}
const job = await crawlGetJob(db, "my-job"); // poll until job?.jobStatus?.status is terminal
const records = await crawlDownload(db, "my-job"); // CrawlDataRecord[]
const csv = await crawlDownload(db, "my-job", { format: "csv" }); // string
```

### Query the Knowledge Graph

```typescript
import { dql } from "@diffbot/typescript";

const results = await dql(db, 'type:Organization name:"Diffbot"');
```

### Web Search

```typescript
import { webSearch } from "@diffbot/typescript";

const results = await webSearch(db, "diffbot knowledge graph");
for (const r of results.search_results as Array<Record<string, unknown>>) {
  console.log(r.score, r.title, r.pageUrl);
}

// snippetLength controls how much of each page comes back in "content":
// "short" (~1-1.5 KB per result), "medium", "long" (default), or "full"
const brief = await webSearch(db, "diffbot knowledge graph", { numResults: 5, snippetLength: "short" });

// "full" with a url: query returns the whole stored page
const page = await webSearch(db, "url:https://en.wikipedia.org/wiki/Knowledge_graph", { snippetLength: "full" });
```

### Caching the Knowledge Graph ontology

`dqlFetchOntology` fetches on every call. For anything that calls it more than once,
`OntologyStore` caches the parsed `Ontology`, dedupes concurrent fetches into one request,
and clears its memo on a rejection so a failed fetch doesn't get stuck:

```typescript
import { DiffbotClient, OntologyStore } from "@diffbot/typescript";

const db = new DiffbotClient({ token: "YOUR_TOKEN" });
const store = new OntologyStore(db);

const ontology = await store.load();
console.log(ontology.types());

// Force a refetch, e.g. after `dqlRefreshOntology`'s old role:
await store.load({ refresh: true });
```

The base `OntologyStore` caches only in memory, for the life of the instance.
`KVOntologyStore` (below) persists across instances via Cloudflare KV; Node users
wanting a filesystem-backed cache should use `FileOntologyStore` from
`@diffbot/typescript/node` — see [Runtime support](#runtime-support-node-vs-everywhere-else).

### Entities (NLP)

```typescript
import { entities } from "@diffbot/typescript";

const result = await entities(db, "Apple CEO Tim Cook announced record quarterly earnings.");
```

For other analyses on the same endpoint (single document), use `nlp()`; the result type is
narrowed to the fields you ask for. `entities()` stays the fixed `entities,sentiment` shortcut.

```typescript
import { nlp } from "@diffbot/typescript";

const result = await nlp(db, "Headline\nApple CEO Tim Cook announced record quarterly earnings.", {
  fields: ["summary", "language"],
  format: "plain text with title",
  documentType: "news article",
  customSummary: { maxNumberOfSentences: 1 },
});
console.log(result.summary, result.language);
```

### Automatic cleanup with `await using`

`DiffbotClient` supports explicit resource management for automatic cleanup:

```typescript
import { DiffbotClient, extract } from "@diffbot/typescript";

await using db = new DiffbotClient({ token: "YOUR_TOKEN" });
const data = await extract(db, "https://www.example.com");
```

## Runtime support: Node vs. everywhere else

The main entry point (`@diffbot/typescript`) imports no Node builtins and has no
import-time side effects — it runs in Node, browsers, and edge runtimes including
Cloudflare Workers, with **no compatibility flags required**. It is enforced, not just
tested: the build target is `platform: "neutral"`, so an accidental `node:fs` import
anywhere in the main entry fails the build, and a post-build script scans the emitted
bundle for node builtins as a second check.

Two things genuinely need a filesystem and live in a separate `@diffbot/typescript/node`
entry point instead:

```typescript
import { resolveToken, FileOntologyStore } from "@diffbot/typescript/node";

const token = resolveToken(); // env, then ~/.diffbot/credentials
const store = new FileOntologyStore(db, "/path/to/ontology.json");
```

| | Main entry (`@diffbot/typescript`) | Node entry (`@diffbot/typescript/node`) |
|---|---|---|
| Token resolution | `resolveTokenFromEnv(token?, env?)` — arg, `env`, `process.env` | `resolveToken(token?, env?)` — same, plus `~/.diffbot/credentials` |
| Ontology cache | `OntologyStore` (memory), `KVOntologyStore` (Cloudflare KV) | `FileOntologyStore` (filesystem) |

## Cloudflare Workers

```typescript
import { DiffbotClient, dql, resolveTokenFromEnv, KVOntologyStore } from "@diffbot/typescript";

export default {
  async fetch(request: Request, env: { DIFFBOT_API_TOKEN: string; ONTOLOGY: KVNamespace }) {
    const db = new DiffbotClient({ token: resolveTokenFromEnv(undefined, env) });
    const ontology = await new KVOntologyStore(db, env.ONTOLOGY).load();
    const results = await dql(db, 'type:Organization name:"Diffbot"');
    return Response.json({ results, types: ontology.types() });
  },
};
```

No `compatibility_flags` entry is needed for this package. Tokens come from `env`, not a
credentials file — there is no filesystem in a Worker, so `resolveToken` (the Node-only,
file-backed version) is not importable here; use `resolveTokenFromEnv`. For the ontology
cache, pass a `KVNamespace` binding straight to `KVOntologyStore` — it satisfies the
store's `KVLike` interface directly, with a lock against concurrent refresh stampedes and
optional stale-while-revalidate via `staleAfterSeconds` + `waitUntil`.

`fixtures/worker/` in this repo is a working Worker exercising exactly this path, verified
in CI against workerd with `compatibility_flags: []`.

## Python ↔ TypeScript API mapping

| Python | TypeScript |
|--------|------------|
| `resolve_token()` | `resolveTokenFromEnv()` (or `resolveToken()` from `@diffbot/typescript/node`) |
| `crawl_list_jobs()` | `crawlListJobs()` |
| `crawl_get_job()` | `crawlGetJob()` |
| `crawl_delete_job()` | `crawlDeleteJob()` |
| `dql_parallel()` | `dqlParallel()` |
| `dql_fetch_ontology()` | `dqlFetchOntology()` |
| `dql_refresh_ontology()` | `new OntologyStore(db).load({ refresh: true })` (or `FileOntologyStore` from `@diffbot/typescript/node`) |
| `web_search(snippet_length=...)` | `webSearch(db, text, { snippetLength })` |
| `ask(response_format=...)` | `ask(db, messages, { responseFormat })` |
| `ask_json()` | `askJson()` |
| `json_schema_format()` | `jsonSchemaFormat()` |

## Development

```bash
pnpm install
pnpm test
pnpm build
```

Live integration tests (requires `DIFFBOT_API_TOKEN`):

```bash
pnpm test:live
```

Cloudflare Worker fixture (proves the main entry needs no compat flags — see
`fixtures/worker/`):

```bash
pnpm build   # fixture resolves the package through dist/
cd fixtures/worker
pnpm install
pnpm exec wrangler deploy --dry-run   # bundle check, no Cloudflare credentials needed
pnpm exec vitest run                  # runs in workerd via @cloudflare/vitest-pool-workers
```

## License

MIT
