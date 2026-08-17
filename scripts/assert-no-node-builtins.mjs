#!/usr/bin/env node
// Fails the build if the core entry (dist/index.js, dist/index.cjs) references
// a node builtin. `platform: "neutral"` in tsup.config.ts should make this
// structurally impossible, but this catches the bare-specifier case (e.g.
// esbuild stripping "node:fs" to "fs") that a prefix-only check would miss.

import { readFileSync } from "node:fs";

const FORBIDDEN = /(?:from|require\()\s*["'](?:node:)?(fs|os|path|crypto|url|stream|async_hooks)(?:\/[^"']*)?["']/g;

const files = ["dist/index.js", "dist/index.cjs"];
let failed = false;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const matches = [...text.matchAll(FORBIDDEN)];
  if (matches.length > 0) {
    failed = true;
    console.error(`✘ ${file} references node builtins:`);
    for (const match of matches) {
      console.error(`  ${match[0]}`);
    }
  }
}

if (failed) {
  console.error(
    "\nThe core entry must stay runtime-neutral. Node-only code belongs in src/node/**.",
  );
  process.exit(1);
}

console.log("✓ core entry is free of node builtins");
