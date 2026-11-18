# S2 leftovers (TypeScript)

S2 of the reduced-scope plan (`sdk-reduced/plan.md` §8, ships as 0.6.0) is complete for
TypeScript. Nothing else is planned after it.

## Landed

- DQL named params on `DqlOptions` (`type`, `col`, `filterExclude`, `exportseparator`,
  `exportfile`, `jsonmode`, `nonCanonicalFacts`, `noDedupArticles`, `cluster`), POST body,
  runtime `ValidationError` for a named key in `extra`. Contract test covers DQL.
- Crawl-create subset on `crawl()` and `customHeaders: string | readonly string[]`
  (repeated params).
- `nlp()` (single document); `entities()` untouched.
- `webSearch()` accepts 1-5 `text` values (repeated `text=` on GET).
- README snippets with example tests, live-suite cases, 0.6.0 changelog section.

## Deliberately narrower than the plan

- `nlp()` requires `fields`. There is no default; `entities()` remains the shortcut.
  The response type is `Pick` over `fields`, so the spec's `errors` key is not in the
  type, although the server may still return it at runtime.
- `cluster` is typed `string`. The vendored spec declares it `never`, so the contract
  test checks only its key, not its value type.
- The crawl-create contract check is a subset check (new names are real spec fields, the
  recurring-crawl fields are not exposed), not equality: `crawl()` keeps its older
  SDK-shaped option names (`hops`, `jobName`, ...).
- `crawl()` has no `extra`, so `repeat`, `maxRounds`, `seedRecrawlFrequency` and
  `onlyProcessIfNew` are not reachable at all (plan: do not invent a backdoor).
- `useCanonical` is a boolean option mapped to `1`/`0` on the wire.
- `package.json` version is not bumped (left for the release tag).

## Not verified here

- The live suite was not run in the session that built S2 (by instruction); Q2 and Q3
  were later confirmed live (see below). The other new cases (`entities` + `nlp` on one
  sentence) are only type-checked and linted.
- Plan §11 Q1 (DQL POST body parity) is confirmed for the cases the live suite covers
  (json, csv, jsonl, long query). The new S2 fields (e.g. `nonCanonicalFacts` as a JSON
  boolean) are not individually live-tested.
- `nlp()` `customSummary` and `documentType` behavior is from the vendored spec only.

## Live confirmations

- Q2 confirmed live: repeated `text=` on GET web search is accepted (HTTP 200, results mix both values; 5 values also 200).
- Q3 confirmed live: GET crawl create works, but job names must be <= 30 chars (longer returns HTTP 200 + errorCode 505 and creates nothing). `crawl()` now throws `APIError` for any HTTP 200 create body carrying `errorCode` (fixed on the Phase 0 branch).
