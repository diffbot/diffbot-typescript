import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.live.test.ts"],
    // Live calls hit the real Diffbot APIs; LLM streaming in particular can run
    // well past vitest's 5s default.
    testTimeout: 60_000,
  },
  resolve: {
    alias: {
      // Same alias as vitest.config.ts (see tsconfig.json's matching "paths" entry):
      // live tests import "@diffbot/typescript", which must resolve to the source.
      "@diffbot/typescript": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
    },
  },
});
