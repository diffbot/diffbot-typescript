# Changelog

All notable changes to `@diffbot/typescript` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/) (pre-1.0: a minor bump may break).

## [0.6.0] - 2026-11-17

First release since 0.3.0. It rolls up three development lines that were never
published on their own: the shared transport, full typing and DQL over POST (planned
as 0.4.0), typed completions plus `account`/`verifyToken`/`crawlDownload`/extract
options (0.5.0), and parameter completion on existing endpoints (0.6.0). No new
Diffbot API areas are added.

### ⚠ Breaking changes

- **DQL is sent as `POST` with a JSON body.** `dql()` / `dqlParallel()` keep the same
  signature and results, but mocks, proxies, or mirrors keyed on `GET` + `?query=` stop
  matching. See [Migrating DQL](#migrating-dql-mocks-proxies-mirrors) below.
- **`crawl()` throws `APIError` when the create call answers HTTP 200 with an
  `errorCode` body** (for example `505`, job name over 30 characters). It used to yield
  `JobCreated` for a job that was never created.
- **A `Retry-After` above `maxDelayMs` (default 5000 ms) is no longer waited out or
  retried.** The call fails at once with `RateLimitError` (`retryAfter` = raw header),
  or `APIError` with `headers["retry-after"]` for a 5xx. Raise `retry.maxDelayMs` to
  keep waiting.
- **`crawlGetJob()` returns `undefined` instead of `{}` for a missing job** (runtime
  change, not only a type change).
- **`dql()` throws `ValidationError` when `extra` repeats a named option** (including
  the new `type`, `col`, `filterExclude`, ...). Code that passed `extra: { type: "text" }`
  must use the named `type` option.
- **Requests are now retried by default** (`429`, `5xx`, connection errors; 3 attempts
  with backoff and jitter). `crawlDeleteJob` is never retried. Pass `retry: false` for
  the old single-attempt behavior.
- **Type-level:** handlers return specific response types instead of `JsonObject`;
  `ChatMessage.role` narrows to `"system" | "user" | "assistant"`; a built-in extract
  API name with an option that API lacks is now a type error. Data shapes at runtime
  are unchanged.

### Added

- **Transport:** per-host base URLs (`apiBase`, `kgBase`, `llmBase`, `nlpBase`; the
  older `*Url` options still win when both are set); repeated query params (array
  values); `HttpClient.delete()`; raw `body` / `contentType` on every request
  (`URLSearchParams` is form-encoded); a per-call `timeout`; the `retry` policy with
  per-call `retryable: false`.
- **Errors:** `NotFoundError` (404) and `JobError`, both subclasses of `APIError`. Error
  response headers are exposed on `APIError.headers`.
- **Typing:** vendored OpenAPI specs under `openapi/`, `pnpm gen:types` generating
  `src/generated/*`, hand-written facade types in `src/types/*`, real `dql()`
  overloads, and type tests. `typescript-eslint` strict-type-checked runs on `src/`.
- `account({ days })` and `verifyToken()` over `GET /v4/account` (`AccountResponse`).
  `verifyToken()` returns `false` only on `AuthError`. The account body contains the
  token and `childTokens`; don't log it.
- `crawlDownload(client, name, { format?, type?, num? })` over `GET /v3/crawl/data`:
  `format: "csv"` and the CSV-only `type: "urls"` return text, otherwise
  `CrawlDataRecord[]`. The `crawl()` watcher uses it. For tools that can't hold a watch
  loop: `crawl(..., { watch: false })`, poll `crawlGetJob`, then `crawlDownload`.
- `extract()` optional fifth argument `ExtractOptions`: `timeout` (server-side, default
  30000), `mode`, per-API typed `fields`, `fallback`, `discussion`, `paging`,
  `maxPages`, `naturalLanguage`, `summaryNumSentences`, `maxTags`, `tagConfidence`,
  `categoryConfidence`, `useProxy`; `proxy`/`proxyAuth` via typed `extra`.
- `dql()` / `dqlParallel()` named options `type` (`"query" | "text" |
  "queryTextFallback" | "crawl"`), `col`, `filterExclude`, `exportseparator`,
  `exportfile`, `jsonmode`, `nonCanonicalFacts`, `noDedupArticles`, `cluster` (sent in
  the POST body). `report` and `view` stay reachable through `extra`.
- `crawl()` create options `urlCrawlRegEx`, `urlProcessRegEx`, `pageProcessPattern`,
  `maxToCrawlPerSubdomain`, `maxToProcessPerSubdomain`, `useCanonical`,
  `notifyWebhook`, `notifyEmail`; `customHeaders` accepts `string | readonly string[]`
  (repeated params).
- `nlp(client, text, { fields, lang?, format?, documentType?, customSummary? })` on the
  existing `POST nl.diffbot.com/v1/` endpoint (single document; result typed as
  `Pick<NaturalLanguageResponse, F>`). `entities()` is unchanged. Exports `NlpOptions`,
  `NlpResponse`.
- `webSearch()` `text` accepts a string or 1-5 strings (repeated `text=`); 0 or more
  than 5 throws `ValidationError` before any request.
- `askJson()` optional `parse` hook for caller-side validation.
- `dql(..., { format: "jsonl" })` streams entities, and `format: "csv"` returns text
  (both used to fail in `JSON.parse`).
- Live test workflow (push to `main`, manual dispatch, twice-monthly cron; never on PRs).

### Changed

- `dql()` request shape: `POST {dqlUrl}?token=…` with `{ query, size, from?, format?,
  filter?, exportspec?, …extra }`. Same defaults (`size` 10, `from` only if non-zero,
  `format` only if not `json`). The token stays in the query string; the query text no
  longer appears in URLs, and the URL length limit is gone.
- `extract()` keeps its request timeout at least 10 s above the wire `timeout`
  (including the 30 s default), so the client no longer aborts just before the server
  answers. A larger client-level `timeout` still wins.
- The user agent is now `diffbot-typescript/0.6.0`.

### Fixed

- `dql(..., { raw: true })` no longer corrupts binary exports (`xls`/`xlsx`, non-UTF-8
  CSV); the body is read as bytes.
- `crawl()`'s URL-report CSV parser no longer splits a quoted field on an inner comma.
- `crawl()` no longer reports `JobCreated` for a create that failed with HTTP 200 +
  `errorCode` (the watch loop then ended silently).
- `APIError.apiMessage` falls back to the body's `error` field, so `{ errorCode, error }`
  bodies give a readable message instead of raw JSON.
- A retried attempt's response body is discarded before the retry, so its connection
  is released instead of staying pinned until garbage collection.

### Known limitations

- `nlp()` requires `fields` (no default); `entities()` remains the shortcut. The
  spec's `errors` key is not in the `Pick` type.
- `cluster` is typed `string` (the vendored spec declares it `never`).
- `crawl()` has no `extra`; recurring-crawl admin (`repeat`, `maxRounds`,
  `seedRecrawlFrequency`, `onlyProcessIfNew`) is deliberately not exposed.
- `extract()` `extra` collisions with `token`/`url`/`timeout` are caught only by the
  compiler, not at runtime.
- `crawlDownload` with `format: "csv"` or `type: "urls"` returns a JSON error body as
  text rather than throwing.
- No generic success-path response headers; use `client.http.get/post` for the raw
  `Response`.

### Migrating DQL: mocks, proxies, mirrors

Anything keyed on `GET` + `?query=` stops matching. Before:

```ts
fetch: async (input) => {
  const url = new URL(String(input));
  if (url.pathname === "/kg/v3/dql" && url.searchParams.get("query")?.includes("Acme")) {
    return Response.json({ data: [] });
  }
  /* ... */
};
```

After:

```ts
fetch: async (input, init) => {
  const url = new URL(String(input));
  if (url.pathname === "/kg/v3/dql" && init?.method === "POST") {
    const { query } = JSON.parse(String(init.body)) as { query: string };
    if (query.includes("Acme")) return Response.json({ data: [] });
  }
  /* ... */
};
```

GET-only proxies/caches or a custom `dqlUrl` mirror that rejects POST: pin 0.3.x, or
call the endpoint with GET yourself via the existing low-level client:

```ts
const res = await client.http.get(client.dqlUrl, {
  params: { token: client.token, query: "type:Organization", size: 10 },
});
```
