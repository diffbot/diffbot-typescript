import type { DiffbotClient } from "./client.js";
import { parseJsonText, readBytes, readNdjson, readText } from "./decode.js";
import { ValidationError } from "./errors.js";
import { ensureOk } from "./http.js";
import { Ontology } from "./ontology.js";
import type { DqlEntity, DqlResponse, ExportFormat } from "./types/dql.js";
import type { ExtraParams } from "./types/extra.js";

const DQL_NAMED_PARAMS = [
  "token",
  "query",
  "type",
  "col",
  "size",
  "from",
  "format",
  "filter",
  "filterExclude",
  "exportspec",
  "exportseparator",
  "exportfile",
  "jsonmode",
  "nonCanonicalFacts",
  "noDedupArticles",
  "cluster",
] as const;

type DqlNamedParam = (typeof DQL_NAMED_PARAMS)[number];

/** `query` and `queryTextFallback` are DQL; `text` is plain-text search; `crawl` searches a crawl collection (see `col`). */
export type DqlType = "query" | "text" | "queryTextFallback" | "crawl";

export interface DqlOptions {
  /** Search type. Omitted from the body by default (the API default is `query`). */
  type?: DqlType;
  /** Crawl collection to search when `type` is `"crawl"`. */
  col?: string;
  size?: number;
  from?: number;
  format?: ExportFormat;
  filter?: string;
  /** DQL clause whose matches are excluded from the results. */
  filterExclude?: string;
  exportspec?: string;
  /** Column separator for `csv`/`xls`/`xlsx` exports. */
  exportseparator?: string;
  /** File name hint for exports. */
  exportfile?: string;
  jsonmode?: "extended" | "id";
  nonCanonicalFacts?: boolean;
  noDedupArticles?: boolean;
  cluster?: string;
  /** Free-form body fields for anything not named above (e.g. `report`, `view`). A named key here throws `ValidationError`. */
  extra?: ExtraParams<DqlNamedParam>;
  raw?: boolean;
}

type DqlResultFor<O extends DqlOptions> = O extends { format: "jsonl" }
  ? AsyncGenerator<DqlEntity>
  : O extends { raw: true }
    ? Uint8Array
    : O extends { format: "xls" | "xlsx" }
      ? Uint8Array
      : O extends { format: "csv" }
        ? string
        : DqlResponse;

/** JSON body for `POST /kg/v3/dql` (`DqlPostRequest`). The token stays in the query string. */
function buildDqlBody(query: string, options: DqlOptions): Record<string, unknown> {
  if (options.extra) {
    const named: readonly string[] = DQL_NAMED_PARAMS;
    const clash = Object.keys(options.extra).filter((key) => named.includes(key));
    if (clash.length) {
      throw new ValidationError(
        `dql(): ${clash.join(", ")} cannot be passed through extra; use the named option instead`,
      );
    }
  }
  const body: Record<string, unknown> = { query, size: options.size ?? 10 };
  if (options.type !== undefined) body.type = options.type;
  if (options.col !== undefined) body.col = options.col;
  if (options.from) body.from = options.from;
  if (options.format && options.format !== "json") body.format = options.format;
  if (options.filter !== undefined) body.filter = options.filter;
  if (options.filterExclude !== undefined) body.filterExclude = options.filterExclude;
  if (options.exportspec !== undefined) body.exportspec = options.exportspec;
  if (options.exportseparator !== undefined) body.exportseparator = options.exportseparator;
  if (options.exportfile !== undefined) body.exportfile = options.exportfile;
  if (options.jsonmode !== undefined) body.jsonmode = options.jsonmode;
  if (options.nonCanonicalFacts !== undefined) body.nonCanonicalFacts = options.nonCanonicalFacts;
  if (options.noDedupArticles !== undefined) body.noDedupArticles = options.noDedupArticles;
  if (options.cluster !== undefined) body.cluster = options.cluster;
  if (options.extra) Object.assign(body, options.extra);
  return body;
}

function resolveDqlKind(format: ExportFormat | undefined, raw: boolean | undefined): "json" | "text" | "bytes" | "ndjson" {
  if (format === "jsonl") return "ndjson";
  if (raw) return "bytes";
  if (format === "xls" || format === "xlsx") return "bytes";
  if (format === "csv") return "text";
  return "json";
}

export async function dql<const O extends DqlOptions = Record<string, never>>(
  client: DiffbotClient,
  query: string,
  options?: O,
): Promise<DqlResultFor<O>>;
export async function dql(
  client: DiffbotClient,
  query: string,
  options: DqlOptions = {},
): Promise<DqlResponse | string | Uint8Array | AsyncGenerator<DqlEntity>> {
  const response = await client.http.post(client.dqlUrl, {
    params: { token: client.token },
    json: buildDqlBody(query, options),
  });
  await ensureOk(response);
  switch (resolveDqlKind(options.format, options.raw)) {
    case "ndjson":
      return readNdjson<DqlEntity>(response);
    case "bytes":
      return readBytes(response);
    case "text":
      return readText(response);
    default:
      return parseJsonText<DqlResponse>(await readText(response));
  }
}

export async function dqlParallel<const Q extends ReadonlyArray<DqlOptions & { query: string }>>(
  client: DiffbotClient,
  queries: Q,
  workers?: number,
): Promise<{ [K in keyof Q]: DqlResultFor<Q[K]> }>;
export async function dqlParallel(
  client: DiffbotClient,
  queries: ReadonlyArray<DqlOptions & { query: string }>,
  workers = 8,
): Promise<Array<DqlResponse | string | Uint8Array | AsyncGenerator<DqlEntity>>> {
  if (!queries.length) return [];

  const limit = Math.min(workers, queries.length);
  const results = new Array<DqlResponse | string | Uint8Array | AsyncGenerator<DqlEntity>>(
    queries.length,
  );
  let index = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const current = index++;
      const entry = queries[current];
      if (entry === undefined) return;
      const { query, ...opts } = entry;
      results[current] = await dql(client, query, opts);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

/** Fetch the raw ontology JSON text. For a parsed, cached `Ontology`, see `OntologyStore`. */
export async function dqlFetchOntologyText(client: DiffbotClient): Promise<string> {
  const response = await client.http.get(client.ontologyUrl);
  await ensureOk(response);
  return readText(response);
}

export async function dqlFetchOntology(client: DiffbotClient): Promise<Ontology> {
  return Ontology.fromJson(await dqlFetchOntologyText(client));
}
