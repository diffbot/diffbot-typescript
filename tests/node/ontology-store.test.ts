import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DiffbotClient } from "../../src/index.js";
import { FileOntologyStore } from "../../src/node/index.js";
import { createMockFetch, jsonResponse } from "../helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("FileOntologyStore", () => {
  let dir: string;

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes the ontology to disk, creating dirs, and reads it back", async () => {
    dir = mkdtempSync(join(tmpdir(), "diffbot-ontology-"));
    const dest = join(dir, "nested", "ontology.json");
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return jsonResponse({ types: { Organization: {} } });
    });

    const store = new FileOntologyStore(db, dest);
    const first = await store.load();
    expect(JSON.parse(readFileSync(dest, "utf8"))).toEqual({ types: { Organization: {} } });

    const second = await new FileOntologyStore(db, dest).load();
    expect(fetches).toBe(1);
    expect(second.types()).toEqual(first.types());
  });

  it("treats a missing file as a cache miss, not an error", async () => {
    dir = mkdtempSync(join(tmpdir(), "diffbot-ontology-"));
    const dest = join(dir, "does-not-exist.json");
    const db = makeClient(() => jsonResponse({ types: {} }));

    const ontology = await new FileOntologyStore(db, dest).load();
    expect(ontology.types()).toEqual([]);
  });
});
