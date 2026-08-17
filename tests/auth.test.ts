import { describe, expect, it, afterEach } from "vitest";
import { resolveTokenFromEnv } from "../src/index.js";

describe("resolveTokenFromEnv", () => {
  const originalEnv = process.env.DIFFBOT_API_TOKEN;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.DIFFBOT_API_TOKEN;
    else process.env.DIFFBOT_API_TOKEN = originalEnv;
  });

  it("prefers explicit token", () => {
    process.env.DIFFBOT_API_TOKEN = "env-token";
    expect(resolveTokenFromEnv("explicit-token")).toBe("explicit-token");
  });

  it("reads a Workers-style env object", () => {
    delete process.env.DIFFBOT_API_TOKEN;
    expect(resolveTokenFromEnv(undefined, { DIFFBOT_API_TOKEN: "kv-env-token" })).toBe(
      "kv-env-token",
    );
  });

  it("prefers the env object over process.env", () => {
    process.env.DIFFBOT_API_TOKEN = "process-token";
    expect(resolveTokenFromEnv(undefined, { DIFFBOT_API_TOKEN: "object-token" })).toBe(
      "object-token",
    );
  });

  it("falls back to process.env when the env object has no token", () => {
    process.env.DIFFBOT_API_TOKEN = "process-token";
    expect(resolveTokenFromEnv(undefined, {})).toBe("process-token");
  });

  it("returns empty when nothing is set", () => {
    delete process.env.DIFFBOT_API_TOKEN;
    expect(resolveTokenFromEnv()).toBe("");
  });
});
