# Changelog

## Unreleased

Phase 0 of the Diffbot SDKs' full HTTP API coverage plan: shared transport
foundation and full type safety for every existing handler. No new API
endpoints land in this phase.

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

### Changed (type-level only; no runtime behavior change beyond what's noted above)

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
