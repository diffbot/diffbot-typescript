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
| `timeout` | `30000` (ms) | all |
| `fetch` | global `fetch` | all |
| `analyzeUrl` | `https://api.diffbot.com/v3` | `extract` |
| `crawlerUrl` | `https://api.diffbot.com/v3/crawl` | `crawl`, `crawlListJobs`, `crawlGetJob`, `crawlDeleteJob` |
| `llmUrl` | `https://llm.diffbot.com/rag/v1/chat/completions` | `ask` |
| `webSearchUrl` | `https://llm.diffbot.com/api/v1/web_search` | `webSearch` |
| `nlpUrl` | `https://nl.diffbot.com/v1/` | `entities` |
| `dqlUrl` | `https://kg.diffbot.com/kg/v3/dql` | `dql`, `dqlParallel` |
| `ontologyUrl` | `https://kg.diffbot.com/kg/ontology` | `dqlFetchOntology`, `dqlFetchOntologyText`, `OntologyStore` |

```typescript
import { DiffbotClient } from "@diffbot/typescript";

const db = new DiffbotClient({
  token: "YOUR_TOKEN",
  timeout: 60_000,
  dqlUrl: "http://localhost:8080/kg/v3/dql",
});
```

`analyzeUrl` and `crawlerUrl` are bases that the SDK appends to (`/${api}` and `/data`
respectively); the rest are complete endpoints, used as given.

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

### Ask Diffbot LLM

```typescript
import { ask } from "@diffbot/typescript";

for await (const chunk of ask(db, [{ role: "user", content: "What's the capital of France?" }])) {
  process.stdout.write(chunk);
}
```

### Crawl a site

```typescript
import { crawl } from "@diffbot/typescript";

for await (const event of crawl(db, "https://www.example.com", { hops: 1 })) {
  console.log(event);
}
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
| `web_search()` | `webSearch()` |

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
