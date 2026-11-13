# Phase 0 leftovers (TypeScript)

Everything else in the Phase 0 scope (opus-plan.md §6 "Phase 0 — Foundation", and the
TS-type-safety items in typesafety-revision.md / the coverage-plan Page) landed. Two
items are deliberately smaller than the plan's framing, documented here rather than
silently shipped as "done":

## 1. No literal "endpoint registry" data structure

opus-plan §3.2/§6 0.1 frames the per-host base URLs as part of "an endpoint registry +
per-host base URLs." What landed is the per-host base URL resolution
(`apiBase`/`kgBase`/`llmBase`/`nlpBase`, old `*Url` options winning aliases) directly in
`src/client.ts` — there's no separate data structure mapping `(operation) -> {path,
authStyle, retryable}`.

This is a deliberate simplification, not an oversight: Phase 0 adds zero new endpoints,
so the only thing a registry would currently serve is base-URL resolution (done) and a
`retryable` flag (done ad hoc, as an explicit `retryable: false` at the one call site
that needs it — `crawlDeleteJob`). Building a generic per-operation table with no second
or third consumer risked guessing the wrong shape for Phase 1+ (Account, Enhance, Bulk,
Custom API, ...), which is where a real registry starts paying for itself (many
operations, a real `authStyle: "query" | "bearer"` split, several `retryable: false`
operations). Revisit when Phase 1 lands.

## 2. Response headers: error path only, not success path

opus-plan §6 0.6 asks for "response headers surfaced to callers," calling out an
`include_headers` option or a `*_raw` variant returning `(body, headers)`.

What landed: every error response's headers are attached to `APIError` (and its
subclasses `AuthError`, `NotFoundError`, `RateLimitError`, `JobError`) via
`headersToRecord()` in `src/decode.ts`, surfaced as `.headers` on the thrown error.
Tested in `tests/http.test.ts`'s `raiseForStatus` suite.

What didn't land: a generic opt-in mechanism for a *successful* response's headers
(e.g. a `{ data, headers, status }` wrapper). The plan's own stated motivation for this
is `X-Diffbot-CoverageReportId` on a DQL coverage report (opus-plan §3.4, §6 0.6's
"prerequisite for DQL coverage reports") — that's a Phase 6 operation (`dqlReport`) that
doesn't exist yet. Building the success-path mechanism now, with no real caller to
shape it against, risked the same guessing problem as the registry above. Build it
alongside `dqlReport`/`dqlReportById` in Phase 6, informed by what that handler actually
needs to return.

## Everything else

Transport (repeated params, DELETE/raw/form bodies, per-call timeout, retry policy,
`NotFoundError`/`JobError`), the three defects (TS dql binary corruption, TS crawl CSV
parsing — the third, Python's `ask` streaming-error fix, is out of scope for this TS-only
assignment), vendored OpenAPI specs + `pnpm gen:types` + `src/generated/*` +
`src/types/*` + `src/decode.ts`, full retyping of every existing handler (`extract`,
`dql`/`dqlParallel`, `crawl`/`crawlListJobs`/`crawlGetJob`, `webSearch`, `entities`,
`ask`/`askJson`, `Ontology`), the typed `extra` escape hatch, and
`typescript-eslint` strict-type-checked on `src/` all landed — see `CHANGELOG.md` for
the user-facing summary and the commit log for the breakdown.

Python's sync/async de-duplication refactor (opus-plan §6 0.11) and the Python
streaming-`ask` fix (opus-plan §6 0.9) are not part of this checkout; they're the
matching Python agent's responsibility per the assignment.
