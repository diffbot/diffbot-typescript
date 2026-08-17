import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveToken, authConfig, defaultCredentialsPath } from "../../src/node/index.js";

describe("resolveToken (node)", () => {
  const originalEnv = process.env.DIFFBOT_API_TOKEN;
  const originalPath = authConfig.credentialsPath;
  let dir: string | undefined;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.DIFFBOT_API_TOKEN;
    else process.env.DIFFBOT_API_TOKEN = originalEnv;
    authConfig.credentialsPath = originalPath;
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("prefers explicit token over everything", () => {
    process.env.DIFFBOT_API_TOKEN = "env-token";
    expect(resolveToken("explicit-token")).toBe("explicit-token");
  });

  it("reads env var before the credentials file", () => {
    process.env.DIFFBOT_API_TOKEN = "env-token";
    authConfig.credentialsPath = "/tmp/missing-diffbot-credentials";
    expect(resolveToken()).toBe("env-token");
  });

  it("falls back to the credentials file", () => {
    delete process.env.DIFFBOT_API_TOKEN;
    dir = mkdtempSync(join(tmpdir(), "diffbot-auth-"));
    const path = join(dir, "credentials");
    writeFileSync(path, "DIFFBOT_API_TOKEN=file-token\n");
    authConfig.credentialsPath = path;
    expect(resolveToken()).toBe("file-token");
  });

  it("returns empty when nothing resolves", () => {
    delete process.env.DIFFBOT_API_TOKEN;
    authConfig.credentialsPath = "/tmp/missing-diffbot-credentials";
    expect(resolveToken()).toBe("");
  });

  it("defaults credentialsPath to ~/.diffbot/credentials", () => {
    expect(defaultCredentialsPath()).toContain(join(".diffbot", "credentials"));
  });
});
