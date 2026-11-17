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

/** JSON body for `POST /kg/v3/dql` (`DqlPostRequest`). The token stays in the query string. */
function buildDqlBody(query: string, options: DqlOptions): Record<string, unknown> {
  const body: Record<string, unknown> = { query, size: options.size ?? 10 };
  if (options.from) body.from = options.from;
  if (options.format && options.format !== "json") body.format = options.format;
  if (options.filter !== undefined) body.filter = options.filter;
  if (options.exportspec !== undefined) body.exportspec = options.exportspec;
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
