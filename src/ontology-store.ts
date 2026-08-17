import type { DiffbotClient } from "./client.js";
import { dqlFetchOntologyText } from "./kg.js";
import { Ontology } from "./ontology.js";

export interface OntologyStoreOptions {
  /**
   * How long a cached entry should be kept, in seconds. Default 86_400 (24h).
   * The base `OntologyStore` doesn't expire its in-memory cache on its own —
   * an explicit `refresh: true` is the only way to bust it — so this only
   * takes effect in subclasses backed by a store with real expiration, like
   * `KVOntologyStore` (where it becomes the KV entry's `expirationTtl`).
   */
  ttlSeconds?: number;
}

/**
 * Fetches and caches the Diffbot KG ontology for a client. The base class
 * caches only in memory, for the lifetime of the instance; subclasses
 * override `read`/`write` to back the cache with a durable store (a
 * filesystem, a KV namespace, ...).
 */
export class OntologyStore {
  readonly client: DiffbotClient;
  protected readonly ttlSeconds: number;
  private inFlight: Promise<Ontology> | null = null;

  constructor(client: DiffbotClient, options: OntologyStoreOptions = {}) {
    this.client = client;
    this.ttlSeconds = options.ttlSeconds ?? 86_400;
  }

  /**
   * Resolve the ontology, from cache when possible. Concurrent calls share
   * one in-flight fetch rather than issuing duplicate requests; a rejected
   * fetch clears the in-flight memo so the next call retries instead of
   * replaying the same failure forever.
   */
  load(options: { refresh?: boolean } = {}): Promise<Ontology> {
    if (options.refresh) {
      this.inFlight = null;
    }
    if (!this.inFlight) {
      this.inFlight = this.resolve(options.refresh ?? false).catch((error: unknown) => {
        this.inFlight = null;
        throw error;
      });
    }
    return this.inFlight;
  }

  private async resolve(refresh: boolean): Promise<Ontology> {
    if (!refresh) {
      const cached = await this.read();
      if (cached !== undefined) {
        try {
          return Ontology.fromJson(cached);
        } catch {
          /* Corrupt cache entry: fall through to a live fetch below. */
        }
      }
    }
    const text = await dqlFetchOntologyText(this.client);
    await this.write(text);
    return Ontology.fromJson(text);
  }

  /** Read the cached ontology text, or `undefined` on a miss. Memory-only by default. */
  protected read(): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  /** Persist ontology text after a fetch. No-op by default. */
  protected write(_text: string): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Structurally typed rather than importing `@cloudflare/workers-types`, so
 * the SDK takes no Cloudflare dependency — a `KVNamespace` binding satisfies
 * this directly.
 */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface KVOntologyStoreOptions extends OntologyStoreOptions {
  /** Default `"diffbot:ontology:v1"`. Bump the suffix to force cache invalidation on a schema change. */
  key?: string;
  /**
   * After this many seconds, a cached entry is served immediately while a
   * refresh runs behind it (stale-while-revalidate) instead of being trusted
   * outright. 0 (default) disables SWR — a cached entry is trusted for its
   * full `ttlSeconds`. Should be less than `ttlSeconds`, or the KV entry
   * expires before it is ever considered stale.
   */
  staleAfterSeconds?: number;
  /**
   * TTL on the refresh lock that prevents concurrent refetches (cron, SWR,
   * manual). Default 60s — Cloudflare KV rejects `expirationTtl` below 60.
   */
  lockTtlSeconds?: number;
  /**
   * `ExecutionContext.waitUntil`. Without it, a background stale-while-revalidate
   * refresh is killed as soon as the response is returned, so SWR degrades to a
   * blocking refresh-on-expiry.
   */
  waitUntil?: (promise: Promise<unknown>) => void;
}

/**
 * KV-backed ontology cache for Cloudflare Workers. Ports the stampede
 * protection and stale-while-revalidate behavior of a production Worker's
 * hand-rolled ontology cache: a short-lived lock key prevents concurrent
 * refreshes from cron, SWR, and a manual refresh all refetching at once, and
 * a `refreshed_at` companion key lets a stale entry be served immediately
 * while a refresh runs in the background.
 */
export class KVOntologyStore extends OntologyStore {
  private readonly kv: KVLike;
  private readonly key: string;
  private readonly refreshedAtKey: string;
  private readonly lockKey: string;
  private readonly staleAfterSeconds: number;
  private readonly lockTtlSeconds: number;
  private readonly waitUntil: ((promise: Promise<unknown>) => void) | undefined;

  constructor(client: DiffbotClient, kv: KVLike, options: KVOntologyStoreOptions = {}) {
    super(client, options);
    this.kv = kv;
    this.key = options.key ?? "diffbot:ontology:v1";
    this.refreshedAtKey = `${this.key}:refreshed_at`;
    this.lockKey = `${this.key}:lock`;
    this.staleAfterSeconds = options.staleAfterSeconds ?? 0;
    this.lockTtlSeconds = options.lockTtlSeconds ?? 60;
    this.waitUntil = options.waitUntil;
  }

  override load(options: { refresh?: boolean } = {}): Promise<Ontology> {
    if (!options.refresh && this.staleAfterSeconds > 0) {
      return this.loadWithStaleWhileRevalidate();
    }
    return super.load(options);
  }

  private async loadWithStaleWhileRevalidate(): Promise<Ontology> {
    const [cached, refreshedAt] = await Promise.all([
      this.kv.get(this.key),
      this.kv.get(this.refreshedAtKey),
    ]);
    if (cached === null) {
      return super.load();
    }

    const age = refreshedAt ? (Date.now() - Number(refreshedAt)) / 1000 : Infinity;
    const isStale = age > this.staleAfterSeconds;
    const ontology = Ontology.fromJson(cached);

    if (isStale) {
      const refresh = super.load({ refresh: true }).catch(() => {
        /* Stale value already served; a failed background refresh just retries next time. */
      });
      if (this.waitUntil) {
        this.waitUntil(refresh);
      } else {
        await refresh;
        return super.load();
      }
    }

    return ontology;
  }

  protected override async read(): Promise<string | undefined> {
    const cached = await this.kv.get(this.key);
    return cached ?? undefined;
  }

  protected override async write(text: string): Promise<void> {
    /* Lock prevents concurrent refreshes from all refetching the same large payload. */
    if (await this.kv.get(this.lockKey)) {
      return;
    }
    await this.kv.put(this.lockKey, "1", { expirationTtl: this.lockTtlSeconds });
    try {
      await this.kv.put(this.key, text, { expirationTtl: this.ttlSeconds });
      await this.kv.put(this.refreshedAtKey, String(Date.now()), {
        expirationTtl: this.ttlSeconds,
      });
    } finally {
      await this.kv.delete(this.lockKey);
    }
  }
}
