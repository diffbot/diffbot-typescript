# Phase 0 leftovers (TypeScript)

Status under the reduced-scope plan (`sdk-reduced/plan.md`, 2026-11-17). The two items
that were originally carried over from Phase 0 are now closed as **won't do**.

## 1. Literal "endpoint registry" data structure — won't do

What landed is per-host base URL resolution (`apiBase`/`kgBase`/`llmBase`/`nlpBase`, with
the older `*Url` options winning as aliases) directly in `src/client.ts`, plus an ad hoc
`retryable: false` at the one call site that needs it (`crawlDeleteJob`).

A per-operation table (`path`, `authStyle`, `retryable`) would only pay for itself with
many new operations. The reduced scope adds just two small GET operations (`account`,
`crawlDownload`), so it never would. Closed.

## 2. Response headers: success path — won't do (DQL reports cut)

Every error response's headers are attached to `APIError` and its subclasses via
`headersToRecord()` in `src/decode.ts` and surfaced as `.headers` (tested in
`tests/http.test.ts`).

A generic opt-in for a successful response's headers (`{ data, headers, status }`) was
motivated only by `X-Diffbot-CoverageReportId` on DQL coverage reports. Those are out of
scope, so there is no in-scope caller. Closed. If a caller needs success-path headers,
`client.http.get(...)` / `client.http.post(...)` return the raw `Response`.

## Everything else

Transport (repeated params, DELETE/raw/form bodies, per-call timeout, retry policy,
`NotFoundError`/`JobError`), the two TS defect fixes (DQL binary corruption, crawl CSV
parsing), vendored OpenAPI specs + `pnpm gen:types` + `src/generated/*` +
`src/types/*` + `src/decode.ts`, full retyping of every existing handler, the typed
`extra` escape hatch, `typescript-eslint` strict-type-checked on `src/`, DQL over POST,
and the live-test workflow all landed. See `CHANGELOG.md` for the user-facing summary.

Python-side items (sync/async de-duplication, streaming `ask` fix) belong to the Python
checkout.
