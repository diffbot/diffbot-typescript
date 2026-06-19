# Diffbot TypeScript Library

TypeScript client library for [Diffbot](https://www.diffbot.com) APIs. This is a port of the [diffbot-python](https://github.com/diffbot/diffbot-python) public library API.

## Installation

```bash
pnpm add diffbot-typescript
```

Requires Node.js 18+ (native `fetch`).

## Usage

In TypeScript, all client methods are async. Use `await` or `for await` where the Python SDK used sync iteration.

### Authentication

```typescript
import { Diffbot, resolveToken } from "diffbot-typescript";

const db = new Diffbot({ token: resolveToken() });
const data = await db.extract("https://www.example.com");
await db.close();
```

Token resolution order:

1. Explicit argument to `resolveToken(token)`
2. `DIFFBOT_API_TOKEN` environment variable
3. `DIFFBOT_API_TOKEN=...` line in `~/.diffbot/credentials`

### Extract structured content

```typescript
import { Diffbot } from "diffbot-typescript";

const db = new Diffbot({ token: "YOUR_TOKEN" });
const data = await db.extract("https://www.example.com");
```

### Ask Diffbot LLM

```typescript
for await (const chunk of db.ask([{ role: "user", content: "What's the capital of France?" }])) {
  process.stdout.write(chunk);
}
```

### Crawl a site

```typescript
for await (const event of db.crawl("https://www.example.com", { hops: 1 })) {
  console.log(event);
}
```

### Query the Knowledge Graph

```typescript
const results = await db.dql('type:Organization name:"Diffbot"');
```

### Web Search

```typescript
const results = await db.webSearch("diffbot knowledge graph");
for (const r of results.search_results as Array<Record<string, unknown>>) {
  console.log(r.score, r.title, r.pageUrl);
}
```

### Entities (NLP)

```typescript
const result = await db.entities("Apple CEO Tim Cook announced record quarterly earnings.");
```

### Async client alias

`DiffbotAsync` is an alias for `Diffbot` (API parity with the Python SDK):

```typescript
await using db = new DiffbotAsync({ token: "YOUR_TOKEN" });
const data = await db.extract("https://www.example.com");
```

## Python ↔ TypeScript API mapping

| Python | TypeScript |
|--------|------------|
| `resolve_token()` | `resolveToken()` |
| `crawl_list_jobs()` | `crawlListJobs()` |
| `crawl_get_job()` | `crawlGetJob()` |
| `crawl_delete_job()` | `crawlDeleteJob()` |
| `dql_parallel()` | `dqlParallel()` |
| `dql_fetch_ontology()` | `dqlFetchOntology()` |
| `dql_refresh_ontology()` | `dqlRefreshOntology()` |
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

## License

MIT
