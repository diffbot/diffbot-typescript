# S1 leftovers (TypeScript)

S1 of the reduced-scope plan (`sdk-reduced/plan.md` §8) is complete for TypeScript:
`account`/`verifyToken`, `crawlDownload`, `ExtractOptions`, the spec contract test,
README snippets (with tests), and the live-suite cases for them.

Not done, by design (S2, not started):

- DQL named params (`type`, `col`, `filterExclude`, ...); `DqlNamedParam` is unchanged.
  The contract test therefore does not cover DQL yet. Add it with S2.
- Crawl-create option subset and multi-value `customHeaders`.
- `nlp()`, and web search multi-value `text`.

Not verified here:

- The live suite (`pnpm test:live`) was not run: no token was resolvable in the build
  environment. The new cases (DQL POST, account, extract options, tiny crawl) have only
  been type-checked and linted. Run it once with a real token before releasing.
- Plan §11 Q1 (DQL POST parity with GET) is confirmed live for the tested cases (json,
  csv, jsonl, long query; long queries only work on POST). `exportspec` and
  string-vs-number values in `extra` are not individually live-tested.
- `GET /v3/crawl/data` for a missing job is assumed to be a 400 error body (per
  `crawl.json`); `crawlDownload` surfaces it as `APIError`.
