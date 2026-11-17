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

- The live suite was not run in this session (by instruction). The new cases (web search
  with `numResults: 1` and 1/2-value `text`; `entities` + `nlp` on one sentence) are only
  type-checked and linted. Plan §11 Q2 (does GET accept repeated `text=`?) is therefore
  still open: run the live suite once with a real token before releasing, and drop the
  multi-value `webSearch` change if the server rejects it.
- Plan §11 Q1 (DQL POST body parity for the new fields, e.g. `nonCanonicalFacts` as JSON
  boolean vs string) and Q3 (crawl GET create supported long term) are unconfirmed.
- `nlp()` `customSummary` and `documentType` behavior is from the vendored spec only.
