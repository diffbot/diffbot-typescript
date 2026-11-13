import type { DiffbotClient } from "./client.js";
import { parseJsonText, readBytes, readNdjson, readText } from "./decode.js";
import { ensureOk } from "./http.js";
import { Ontology } from "./ontology.js";
import type { DqlEntity, DqlResponse, ExportFormat } from "./types/dql.js";
import type { ExtraParams } from "./types/extra.js";

type DqlNamedParam = "token" | "query" | "size" | "from" | "format" | "filter" | "exportspec";

export interface DqlOptions {
  size?: number;
  from?: number;
  format?: ExportFormat;
  filter?: string;
  exportspec?: string;
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

function buildDqlParams(
  client: DiffbotClient,
  query: string,
  options: DqlOptions,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    token: client.token,
    query,
    size: options.size ?? 10,
  };
  if (options.from) params.from = options.from;
  if (options.format && options.format !== "json") params.format = options.format;
  if (options.filter !== undefined) params.filter = options.filter;
  if (options.exportspec !== undefined) params.exportspec = options.exportspec;
  if (options.extra) Object.assign(params, options.extra);
  return params;
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
  const params = buildDqlParams(client, query, options);
  const response = await client.http.get(client.dqlUrl, { params });
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
  const results: Array<DqlResponse | string | Uint8Array | AsyncGenerator<DqlEntity>> = new Array(
    queries.length,
  );
  let index = 0;

  async function worker(): Promise<void> {
    while (true) {
      const current = index++;
      if (current >= queries.length) return;
      const { query, ...opts } = queries[current]!;
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
