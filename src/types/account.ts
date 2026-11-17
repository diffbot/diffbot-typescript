/** Hand-written facade over `src/generated/account.ts`. */
import type { operations } from "../generated/account.js";
import type { JsonObject } from "../json.js";

export type AccountResponse = operations["account"]["responses"][200]["content"]["application/json"];
export type AccountUsage = NonNullable<AccountResponse["usage"]>[number];

type _AccountResponseIsJsonObject = AccountResponse extends JsonObject ? true : never;
const _accountResponseIsJsonObject: _AccountResponseIsJsonObject = true;
