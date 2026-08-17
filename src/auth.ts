import { TOKEN_ENV_VAR } from "./constants.js";

/*
 * `object`, not `Record<string, unknown>`: a typed Workers `Env` is normally
 * an `interface`, and interfaces don't get TypeScript's implicit index
 * signature, so a `Record<string, unknown>` parameter would reject exactly
 * the argument this function exists to accept. `object` has no members, so
 * any object type is assignable to it; the bracket access below is cast
 * internally instead.
 */
export type TokenSource = object;

function envToken(env: TokenSource | undefined): string {
  const fromEnv = (env as Record<string, unknown> | undefined)?.[TOKEN_ENV_VAR];
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim();
  }

  /*
   * Guarded rather than a static `process.env` read: `process` does not exist
   * in Workers/browsers, and touching it unconditionally would reintroduce a
   * runtime-specific dependency into an otherwise platform-neutral module.
   */
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const fromProcess = proc?.env?.[TOKEN_ENV_VAR];
  return fromProcess?.trim() ?? "";
}

/**
 * Resolve a Diffbot API token from an explicit arg, then a Workers-style
 * `env` object, then `process.env`. Does not touch the filesystem — for a
 * credentials-file fallback, use `resolveToken` from `@diffbot/typescript/node`.
 */
export function resolveTokenFromEnv(token?: string | null, env?: TokenSource): string {
  if (token?.trim()) {
    return token.trim();
  }
  return envToken(env);
}
