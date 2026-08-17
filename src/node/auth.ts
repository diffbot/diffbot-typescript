import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { resolveTokenFromEnv, type TokenSource } from "@diffbot/typescript";

const TOKEN_ENV_VAR = "DIFFBOT_API_TOKEN";

export function defaultCredentialsPath(): string {
  return join(homedir(), ".diffbot", "credentials");
}

/** Mutable for tests; defaults to `~/.diffbot/credentials`. */
export const authConfig: { credentialsPath?: string } = {};

function readCredentialsFile(path: string): string {
  if (!existsSync(path)) {
    return "";
  }
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`${TOKEN_ENV_VAR}=`)) {
      return trimmed.slice(TOKEN_ENV_VAR.length + 1).trim();
    }
  }
  return "";
}

/**
 * Resolve a Diffbot API token from an explicit arg, an `env` object, then
 * `process.env`, then `~/.diffbot/credentials`. Superset of the core
 * `resolveTokenFromEnv` — same first three steps, plus the file fallback.
 */
export function resolveToken(token?: string | null, env?: TokenSource): string {
  const fromEnv = resolveTokenFromEnv(token, env);
  if (fromEnv) {
    return fromEnv;
  }
  return readCredentialsFile(authConfig.credentialsPath ?? defaultCredentialsPath());
}
