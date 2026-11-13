Vendored from `/workspace/cc-runs/sdk-coverage/docs/openapi/*.json` (the Diffbot SDK
coverage audit's local snapshot of Diffbot's published OpenAPI specs). Regenerate
`src/generated/*.ts` from these with `pnpm gen:types`; never hand-edit the generated
output.

`natural-language.json` was originally Swagger 2.0 (openapi-typescript only accepts
3.x). It was converted once with `swagger2openapi --patch` and is committed here as
OpenAPI 3.0 — there is no ongoing conversion step.
