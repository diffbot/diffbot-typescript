/** Hand-written facade over `src/generated/dql.ts`, kept assignable to `JsonObject`. */
import type { components } from "../generated/dql.js";
import type { JsonObject } from "../json.js";

export type DqlResponse = components["schemas"]["DqlResponse"];
export type DqlEntity = components["schemas"]["Data"];
export type DqlRewrite = components["schemas"]["Rewrite"];
export type ExportFormat = "json" | "jsonl" | "csv" | "xls" | "xlsx";

// Compile-time guard: response overlays must stay assignable to JsonObject (see
// typesafety-revision.md) so a server-added field never breaks a caller.
type _DqlResponseIsJsonObject = DqlResponse extends JsonObject ? true : never;
const _dqlResponseIsJsonObject: _DqlResponseIsJsonObject = true;
void _dqlResponseIsJsonObject;
