import { defineConfig } from "tsup";

export default defineConfig([
  {
    /*
     * Core must stay importable with zero node builtins. `platform: "neutral"`
     * gives esbuild no node fallback to resolve against, so an accidental
     * `import "node:fs"` here fails the build instead of shipping silently.
     */
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    platform: "neutral",
    target: "es2022",
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: { "node/index": "src/node/index.ts" },
    format: ["esm", "cjs"],
    platform: "node",
    target: "node18",
    dts: true,
    sourcemap: true,
    clean: false,
    /*
     * Must stay external and self-referenced by package name (not a relative
     * import), never inlined: CJS has no code splitting, so bundling core into
     * this entry would produce a second, distinct `OntologyStore` class and
     * break `instanceof` across the two entry points.
     */
    external: ["@diffbot/typescript"],
  },
]);
