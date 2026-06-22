import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { TOKEN_ENV_VAR } from "./constants.js";

/** Mutable for tests; defaults to ~/.diffbot/credentials. */
export const authConfig = {
  credentialsPath: join(homedir(), ".diffbot", "credentials"),
};

function readCredentialsFile(path = authConfig.credentialsPath): string {
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

/** Resolve a Diffbot API token from explicit arg, env var, or credentials file. */
export function resolveToken(token?: string | null): string {
  if (token?.trim()) {
    return token.trim();
  }

  const envToken = process.env[TOKEN_ENV_VAR]?.trim();
  if (envToken) {
    return envToken;
  }

  return readCredentialsFile();
}
