import type { DiffbotClient } from "./client.js";
import { readBodyText, raiseForStatus } from "./http.js";
import type { JsonObject } from "./json.js";
import { Ontology } from "./ontology.js";

export interface DqlOptions {
  size?: number;
  from?: number;
  format?: string;
  filter?: string;
  exportspec?: string;
  extra?: Record<string, string>;
  raw?: boolean;
}

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

export async function dql(
  client: DiffbotClient,
  query: string,
  options: DqlOptions = {},
): Promise<JsonObject | Uint8Array> {
  const params = buildDqlParams(client, query, options);
  const response = await client.http.get(client.dqlUrl, { params });
  const body = await readBodyText(response);
  raiseForStatus(response, body);
  if (options.raw) {
    return new TextEncoder().encode(body);
  }
  return JSON.parse(body) as JsonObject;
}

export async function dqlParallel(
  client: DiffbotClient,
  queries: Array<DqlOptions & { query: string }>,
  workers = 8,
): Promise<Array<JsonObject | Uint8Array>> {
  if (!queries.length) return [];

  const limit = Math.min(workers, queries.length);
  const results: Array<JsonObject | Uint8Array> = new Array(queries.length);
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
  const body = await readBodyText(response);
  raiseForStatus(response, body);
  return body;
}

export async function dqlFetchOntology(client: DiffbotClient): Promise<Ontology> {
  return Ontology.fromJson(await dqlFetchOntologyText(client));
}
