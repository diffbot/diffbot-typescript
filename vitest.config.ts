import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/**/*.live.test.ts"],
  },
  resolve: {
    alias: {
      // See tsconfig.json's matching "paths" entry for why this alias exists.
      "@diffbot/typescript": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
    },
  },
});
