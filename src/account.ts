import type { DiffbotClient } from "./client.js";
import { parseJsonText, readText } from "./decode.js";
import { AuthError } from "./errors.js";
import { ensureOk } from "./http.js";
import type { AccountResponse } from "./types/account.js";

export type { AccountResponse, AccountUsage } from "./types/account.js";

export interface AccountOptions {
  /** Window, in days, for the `usage` array (API default: 31). */
  days?: number;
}

/**
 * `GET /v4/account`: plan, status and per-day usage for the token. Free, and the only
 * documented token probe. The response includes the token itself and any child tokens,
 * so never log it.
 */
export async function account(client: DiffbotClient, options: AccountOptions = {}): Promise<AccountResponse> {
  const params: Record<string, string | number> = { token: client.token };
  if (options.days !== undefined) params.days = options.days;
  const response = await client.http.get(`${client.apiBase}/v4/account`, { params });
  await ensureOk(response);
  return parseJsonText<AccountResponse>(await readText(response));
}

/**
 * `true` if the token is accepted, `false` if the API rejects it (`AuthError`). Every other
 * failure (network, 5xx, rate limit, ...) propagates: it says nothing about the token.
 */
export async function verifyToken(client: DiffbotClient): Promise<boolean> {
  try {
    await account(client, { days: 1 });
    return true;
  } catch (error) {
    if (error instanceof AuthError) return false;
    throw error;
  }
}
