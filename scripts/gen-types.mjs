#!/usr/bin/env node
// Regenerates src/generated/*.ts from the vendored specs under openapi/.
// Run via `pnpm gen:types`. Committed output — do not hand-edit src/generated/*.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const root = fileURLToPath(new URL("..", import.meta.url));
const openapiDir = new URL("../openapi/", import.meta.url);
const outDir = new URL("../src/generated/", import.meta.url);

await mkdir(outDir, { recursive: true });

const files = (await readdir(openapiDir)).filter((f) => f.endsWith(".json")).sort();

for (const file of files) {
  const specPath = new URL(file, openapiDir);
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  const ast = await openapiTS(spec, { cwd: root });
  const body = astToString(ast);
  const name = file.replace(/\.json$/, "");
  const banner = `/**\n * Generated from openapi/${file} by \`pnpm gen:types\`. Do not hand-edit.\n * Source: openapi-typescript v${JSON.parse(await readFile(new URL("../node_modules/openapi-typescript/package.json", import.meta.url), "utf8")).version}\n */\n`;
  await writeFile(new URL(`${name}.ts`, outDir), banner + body);
  console.log(`generated src/generated/${name}.ts`);
}
