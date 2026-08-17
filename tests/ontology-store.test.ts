import { describe, expect, it } from "vitest";
import { DiffbotClient, KVOntologyStore, OntologyStore, type KVLike } from "../src/index.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

function mapStore(): KVLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: async (key) => data.get(key) ?? null,
    put: async (key, value) => {
      data.set(key, value);
    },
    delete: async (key) => {
      data.delete(key);
    },
  };
}

describe("OntologyStore", () => {
  it("fetches once and serves from memory after", async () => {
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return jsonResponse({ types: { Organization: {} } });
    });
    const store = new OntologyStore(db);

    const first = await store.load();
    const second = await store.load();

    expect(fetches).toBe(1);
    expect(first).toBe(second);
    expect(first.types()).toEqual(["Organization"]);
  });

  it("dedupes concurrent first calls into one fetch", async () => {
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return jsonResponse({ types: {} });
    });
    const store = new OntologyStore(db);

    const [a, b] = await Promise.all([store.load(), store.load()]);

    expect(fetches).toBe(1);
    expect(a).toBe(b);
  });

  it("clears the memo on rejection so the next call retries", async () => {
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return fetches === 1 ? jsonResponse({ code: 401, message: "nope" }, 401) : jsonResponse({ types: {} });
    });
    const store = new OntologyStore(db);

    await expect(store.load()).rejects.toMatchObject({ name: "AuthError" });
    const ontology = await store.load();

    expect(fetches).toBe(2);
    expect(ontology.types()).toEqual([]);
  });

  it("refresh forces a refetch", async () => {
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return jsonResponse({ types: {} });
    });
    const store = new OntologyStore(db);

    await store.load();
    await store.load({ refresh: true });

    expect(fetches).toBe(2);
  });
});

describe("KVOntologyStore", () => {
  it("reads through KV on a cold memory cache", async () => {
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return jsonResponse({ types: { Organization: {} } });
    });
    const kv = mapStore();

    await new KVOntologyStore(db, kv).load();
    // A second, freshly constructed store simulates a recycled isolate.
    const ontology = await new KVOntologyStore(db, kv).load();

    expect(fetches).toBe(1);
    expect(ontology.types()).toEqual(["Organization"]);
  });

  it("refresh refetches and rewrites KV", async () => {
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return jsonResponse({ types: {} });
    });
    const kv = mapStore();
    const store = new KVOntologyStore(db, kv);

    await store.load();
    await store.load({ refresh: true });

    expect(fetches).toBe(2);
  });

  it("treats a corrupt cache entry as a miss and refetches", async () => {
    let fetches = 0;
    const db = makeClient(() => {
      fetches++;
      return jsonResponse({ types: {} });
    });
    const kv = mapStore();
    kv.data.set("diffbot:ontology:v1", "{not json");

    const ontology = await new KVOntologyStore(db, kv).load();

    expect(fetches).toBe(1);
    expect(ontology.types()).toEqual([]);
  });

  it("releases the write lock after a successful write", async () => {
    const db = makeClient(() => jsonResponse({ types: {} }));
    const kv = mapStore();

    await new KVOntologyStore(db, kv).load();

    expect(kv.data.get("diffbot:ontology:v1:lock")).toBeUndefined();
    expect(kv.data.get("diffbot:ontology:v1")).toBeDefined();
  });

  it("skips the write when a refresh lock is already held", async () => {
    const db = makeClient(() => jsonResponse({ types: { New: {} } }));
    const kv = mapStore();
    kv.data.set("diffbot:ontology:v1:lock", "1");

    await new KVOntologyStore(db, kv).load({ refresh: true });

    // The fetch still happens and is returned to the caller; only the KV
    // write is skipped, deferring to whoever is already holding the lock.
    expect(kv.data.get("diffbot:ontology:v1")).toBeUndefined();
  });

  describe("stale-while-revalidate", () => {
    it("serves a stale entry immediately and revalidates via waitUntil", async () => {
      let fetches = 0;
      const db = makeClient(() => {
        fetches++;
        return jsonResponse({ types: { Fresh: {} } });
      });
      const kv = mapStore();
      kv.data.set("diffbot:ontology:v1", JSON.stringify({ types: { Stale: {} } }));
      kv.data.set("diffbot:ontology:v1:refreshed_at", String(Date.now() - 1000 * 1000));

      const background: Promise<unknown>[] = [];
      const store = new KVOntologyStore(db, kv, {
        staleAfterSeconds: 60,
        waitUntil: (p) => background.push(p),
      });

      const ontology = await store.load();

      expect(ontology.types()).toEqual(["Stale"]);
      expect(fetches).toBe(1); // background refresh already fired
      await Promise.all(background);
      expect(kv.data.get("diffbot:ontology:v1")).toContain("Fresh");
    });

    it("without waitUntil, blocks and returns the fresh value", async () => {
      let fetches = 0;
      const db = makeClient(() => {
        fetches++;
        return jsonResponse({ types: { Fresh: {} } });
      });
      const kv = mapStore();
      kv.data.set("diffbot:ontology:v1", JSON.stringify({ types: { Stale: {} } }));
      kv.data.set("diffbot:ontology:v1:refreshed_at", String(Date.now() - 1000 * 1000));

      const store = new KVOntologyStore(db, kv, { staleAfterSeconds: 60 });
      const ontology = await store.load();

      expect(fetches).toBe(1);
      expect(ontology.types()).toEqual(["Fresh"]);
    });
  });
});
