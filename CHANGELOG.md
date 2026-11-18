# Changelog

## Unreleased (0.6.0)

Parameter completion on endpoints the SDK already uses (S2 of the reduced-scope plan).
Additive, with one small runtime tightening noted under Changed. `package.json` is not
bumped here; that happens at release.

### Added

- `dql()` / `dqlParallel()` named options: `type` (`"query" | "text" | "queryTextFallback"
  | "crawl"`, so `type: "crawl"` with `col` searches a crawl collection), `col`,
  `filterExclude`, `exportseparator`, `exportfile`, `jsonmode`, `nonCanonicalFacts`,
  `noDedupArticles`, `cluster`. They go in the POST JSON body; the token stays in the
  query string. `size` still defaults to 10. `report` and `view` are not named (reports
  are out of scope) and remain reachable through `extra`.
- `crawl()` named create options (still query params on the existing GET create):
  `urlCrawlRegEx`, `urlProcessRegEx`, `pageProcessPattern`, `maxToCrawlPerSubdomain`,
  `maxToProcessPerSubdomain`, `useCanonical` (`false` sends `useCanonical=0`),
  `notifyWebhook`, `notifyEmail`.
- `crawl()` `customHeaders` accepts `string | readonly string[]`; arrays are sent as
  repeated `customHeaders` params. Recurring-crawl admin (`repeat`, `maxRounds`,
  `seedRecrawlFrequency`, `onlyProcessIfNew`) is deliberately not exposed.
- `nlp(client, text, { fields, lang?, format?, documentType?, customSummary? })` on the
  existing `POST nl.diffbot.com/v1/` endpoint, single document. The result type is
  `Pick<NaturalLanguageResponse, F>` for the requested fields. `entities()` is unchanged.
  Also exported: `NlpOptions`, `NlpResponse`.
- `webSearch()` `text` accepts a string or 1-5 strings, sent as repeated `text=` params
  on the existing GET. 0 or more than 5 throws `ValidationError` before any request.
  A single string behaves exactly as before.
- Contract type test now covers DQL (named options + an explicit allowlist == spec
  keys) and the new crawl-create options.

### Changed

- **`Retry-After` now has a ceiling.** `RetryPolicy.maxDelayMs` (default 5000) used to
  cap only the exponential backoff, so a 429/5xx with `Retry-After: 3600` made one call
  sleep an hour. Now, if `Retry-After` (seconds or HTTP-date form) exceeds `maxDelayMs`,
  the SDK neither sleeps nor retries; it surfaces that response at once, so the caller
  gets `RateLimitError` with `retryAfter` set (or `APIError` with the header in `headers`
  for a 5xx). A `Retry-After` at or under the cap is honored as before. Raise
  `maxDelayMs` to keep waiting out longer server-requested delays.
- `dql()`: a key in `extra` that duplicates a named option (now including `type`, `col`,
  `filterExclude`, ...) throws `ValidationError`. TypeScript already rejected this at
  compile time for the old named keys; code that passed `extra: { type: "text" }` must
  switch to the named `type` option.

## 0.5.0

Typing and completions for endpoints the SDK already uses, plus two small methods
that complete existing workflows. Additive only.

### Added

- `account({ days })` and `verifyToken()` over `GET /v4/account`, with an `AccountResponse`
  type. `verifyToken()` asks for one day of usage and returns `false` only on
  `AuthError`; every other error propagates. The account body includes the token and
  `childTokens`, so don't log it.
- `crawlDownload(client, name, { format?, type?, num? })` over `GET /v3/crawl/data`:
  `format: "csv"` (and the CSV-only `type: "urls"` URL report) return text; otherwise
  `CrawlDataRecord[]`. The `crawl()` watcher now calls it internally. Recommended
  pattern for tools that cannot hold a watch loop: `crawl(..., { watch: false })`,
  poll `crawlGetJob`, then `crawlDownload`.
- `extract()` takes an optional fifth argument `options` (per-API `ExtractOptions`):
  `timeout` (server-side, default stays 30000), `mode` (overrides `fmt: "markdown"`),
  `fields` (typed per API), `fallback`, `discussion`, `paging`, `maxPages`,
  `naturalLanguage`, `summaryNumSentences`, `maxTags`, `tagConfidence`,
  `categoryConfidence`, `useProxy`. `proxy`/`proxyAuth` go through typed `extra`;
  `callback` is not exposed. A contract type test keeps these in sync with the
  vendored spec.

### Changed

- `extract()` now keeps its request timeout at least 10 s above the wire `timeout`
  (including the 30 s default), so the client no longer aborts just before the
  server would answer. A larger client-level `timeout` still wins.
- Passing a built-in API name with an option that API does not have is now a type
  error rather than falling through to the open Custom API overload.

## 0.4.0

Shared transport foundation, full type safety for every existing handler, and DQL
over POST. No new API endpoints land in this release.

### Changed

- **`dql()` / `dqlParallel()` now send `POST {dqlUrl}?token=…` with a JSON body**
  (`{ query, size, from?, format?, filter?, exportspec?, …extra }`) instead of a GET with
  everything in the query string. The public API is unchanged: same names, options,
  defaults (`size` 10, `from` only if non-zero, `format` only if not `json`),
  overloads and return types. This removes the URL length limit and keeps the query
  text out of URLs and access logs; the token stays in the query string. `size`/`from`
  are sent as JSON numbers; `extra` values pass through verbatim. Retries are unchanged.
- `crawlGetJob()` returns `undefined` instead of `{}` for a missing job (a runtime
  behavior change, not just a type change).

#### Migrating: mocks, proxies, mirrors

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

### Added

- Per-host base URL options: `apiBase`, `kgBase`, `llmBase`, `nlpBase`. The
  older per-endpoint options (`analyzeUrl`, `crawlerUrl`, `llmUrl`,
  `webSearchUrl`, `nlpUrl`, `dqlUrl`, `ontologyUrl`) still work and win over
  the matching base when both are set.
- Repeated query parameters: `HttpRequestOptions.params` accepts arrays.
- `HttpClient.delete()`, plus a `body`/`contentType` option on every request
  for raw (string/bytes/`URLSearchParams`) bodies with a caller-overridable
  `Content-Type`; a `URLSearchParams` body is form-encoded automatically.
- A per-call `timeout` option, separate from the client-level default.
- A default-on retry policy (`retry` client option) for `429`/`5xx`/connection
  errors, with backoff, jitter, and `Retry-After` support, capped at 3
  attempts by default. Disable with `retry: false`, or opt a single call out
  with `retryable: false` (used internally by `crawlDeleteJob`, a GET-shaped
  mutation that must never be retried blindly).
- `NotFoundError` (404) and `JobError`, both subclassing `APIError` so
  existing `catch (APIError)` call sites are unaffected.
- `dql(..., { format: "jsonl" })` now actually streams entities instead of
  failing a `JSON.parse`; `dql(..., { format: "csv" })` returns text instead
  of attempting to parse it as JSON.
- `askJson()` takes an optional `parse` hook so a caller-supplied validator
  checks the result instead of an unchecked cast.
- Vendored OpenAPI specs under `openapi/`, `pnpm gen:types`
  (openapi-typescript) generating `src/generated/*`, hand-written public
  facade types in `src/types/*`, and `typescript-eslint` strict-type-checked
  on `src/` (`pnpm lint`). Every existing handler's response is now a real
  type instead of `JsonObject`.

### Fixed

- `dql(..., { raw: true })` no longer corrupts binary exports (`xls`/`xlsx`,
  or non-UTF-8 CSV): the response is read as bytes instead of being decoded
  as text and re-encoded, which replaced invalid-UTF-8 bytes with U+FFFD.
- `crawl()`'s URL-report CSV parser no longer splits a quoted field on a
  comma inside it.
- `crawl()` throws `APIError` when the create call answers HTTP 200 with an
  `errorCode` body (for example `505`, a job name over 30 characters). Before, it
  reported `JobCreated` for a job that was never created, and the watch loop then
  ended silently.
- `APIError.apiMessage` falls back to the body's `error` field when there is no
  `message`, so `{ errorCode, error }` bodies produce a readable error message.
- A retried attempt's response body is discarded before the retry, so its
  connection is released instead of staying pinned until garbage collection.

### Type-level changes

- `crawlGetJob()` returns `CrawlJob | undefined` instead of `{}` for a
  missing job — a job that previously looked like an empty-but-present
  record is now distinguishable from one that doesn't exist. **This is a
  runtime behavior change**, not just a type change.
- `ChatMessage.role` narrows from `string` to `"system" | "user" | "assistant"`.
- `extract()`, `dql()`/`dqlParallel()`, `crawlListJobs()`, `webSearch()`,
  `entities()` return specific types instead of `JsonObject`/`Uint8Array`
  unions inferred loosely. Code that read undeclared keys off the returned
  object, or assigned the result somewhere expecting a looser type, may need
  a type-level adjustment — the shape of the data itself hasn't changed.
