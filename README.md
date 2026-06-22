# Diffbot TypeScript Library

TypeScript client library for [Diffbot](https://www.diffbot.com) APIs. This is a port of the [diffbot-python](https://github.com/diffbot/diffbot-python) public library API.

## Installation

```bash
pnpm add diffbot-typescript
```

Requires Node.js 18+ (native `fetch`).

## Usage

In TypeScript, all API functions are async. Use `await` or `for await` where the Python SDK used sync iteration.

Create a client once, then pass it to the API functions you need. Import only the functions you use so bundlers can tree-shake unused code.

### Authentication

```typescript
import { DiffbotClient, extract, resolveToken } from "diffbot-typescript";

const db = new DiffbotClient({ token: resolveToken() });
const data = await extract(db, "https://www.example.com");
await db.close();
```

Token resolution order:

1. Explicit argument to `resolveToken(token)`
2. `DIFFBOT_API_TOKEN` environment variable
3. `DIFFBOT_API_TOKEN=...` line in `~/.diffbot/credentials`

### Extract structured content

```typescript
import { DiffbotClient, extract } from "diffbot-typescript";

const db = new DiffbotClient({ token: "YOUR_TOKEN" });
const data = await extract(db, "https://www.example.com");
```

### Ask Diffbot LLM

```typescript
import { ask } from "diffbot-typescript";

for await (const chunk of ask(db, [{ role: "user", content: "What's the capital of France?" }])) {
  process.stdout.write(chunk);
}
```

### Crawl a site

```typescript
import { crawl } from "diffbot-typescript";

for await (const event of crawl(db, "https://www.example.com", { hops: 1 })) {
  console.log(event);
}
```

### Query the Knowledge Graph

```typescript
import { dql } from "diffbot-typescript";

const results = await dql(db, 'type:Organization name:"Diffbot"');
```

### Web Search

```typescript
import { webSearch } from "diffbot-typescript";

const results = await webSearch(db, "diffbot knowledge graph");
for (const r of results.search_results as Array<Record<string, unknown>>) {
  console.log(r.score, r.title, r.pageUrl);
}
```

### Entities (NLP)

```typescript
import { entities } from "diffbot-typescript";

const result = await entities(db, "Apple CEO Tim Cook announced record quarterly earnings.");
```

### Automatic cleanup with `await using`

`DiffbotClient` supports explicit resource management for automatic cleanup:

```typescript
import { DiffbotClient, extract } from "diffbot-typescript";

await using db = new DiffbotClient({ token: "YOUR_TOKEN" });
const data = await extract(db, "https://www.example.com");
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
