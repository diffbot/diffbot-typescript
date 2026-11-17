import { describe, expectTypeOf, it } from "vitest";
import type * as publicApi from "../../src/index.js";
import { DiffbotClient, dql, dqlParallel, type DqlOptions } from "../../src/index.js";
import type { DqlEntity, DqlResponse } from "../../src/types/dql.js";

declare const db: DiffbotClient;

describe("dql() format overloads", () => {
  it("defaults to a parsed DqlResponse", () => {
    expectTypeOf(dql(db, "type:Organization")).resolves.toEqualTypeOf<DqlResponse>();
    expectTypeOf(dql(db, "type:Organization", { format: "json" })).resolves.toEqualTypeOf<DqlResponse>();
  });

  it("returns a string for csv", () => {
    expectTypeOf(dql(db, "type:Organization", { format: "csv" })).resolves.toEqualTypeOf<string>();
  });

  it("returns bytes for xls/xlsx or raw", () => {
    expectTypeOf(dql(db, "type:Organization", { format: "xls" })).resolves.toEqualTypeOf<Uint8Array>();
    expectTypeOf(dql(db, "type:Organization", { format: "xlsx" })).resolves.toEqualTypeOf<Uint8Array>();
    expectTypeOf(dql(db, "type:Organization", { raw: true })).resolves.toEqualTypeOf<Uint8Array>();
  });

  it("returns an async generator of entities for jsonl", () => {
    expectTypeOf(dql(db, "type:Organization", { format: "jsonl" })).resolves.toEqualTypeOf<
      AsyncGenerator<DqlEntity>
    >();
  });

  it("rejects a named option passed through extra", () => {
    // @ts-expect-error -- "size" collides with the named `size` option.
    void dql(db, "type:Organization", { extra: { size: "5" } });
  });

  it("types the new named params and rejects them in extra", () => {
    expectTypeOf<DqlOptions["type"]>().toEqualTypeOf<"query" | "text" | "queryTextFallback" | "crawl" | undefined>();
    // @ts-expect-error -- "col" is a named option now.
    void dql(db, "q", { extra: { col: "x" } });
    // report/view stay reachable through extra.
    void dql(db, "q", { extra: { report: "true", view: "v" } });
  });

  it("dqlParallel maps each query's own format to its own result type", async () => {
    const results = await dqlParallel(db, [
      { query: "a" },
      { query: "b", format: "csv" },
      { query: "c", format: "xlsx" },
    ]);
    expectTypeOf(results[0]).toEqualTypeOf<DqlResponse>();
    expectTypeOf(results[1]).toEqualTypeOf<string>();
    expectTypeOf(results[2]).toEqualTypeOf<Uint8Array>();
  });
});

describe("dql() public contract is unchanged by the GET -> POST switch", () => {
  it("keeps the same option keys (no `method` option, no `dqlPost`)", () => {
    expectTypeOf<keyof DqlOptions>().toEqualTypeOf<
      | "size"
      | "from"
      | "format"
      | "filter"
      | "exportspec"
      | "extra"
      | "raw"
      | "type"
      | "col"
      | "filterExclude"
      | "exportseparator"
      | "exportfile"
      | "jsonmode"
      | "nonCanonicalFacts"
      | "noDedupArticles"
      | "cluster"
    >();
    expectTypeOf<"dqlPost" extends keyof typeof publicApi ? true : false>().toEqualTypeOf<false>();
  });

  it("keeps size/from as numbers", () => {
    expectTypeOf<DqlOptions["size"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<DqlOptions["from"]>().toEqualTypeOf<number | undefined>();
  });

  it("dqlParallel still accepts per-query options and a worker count (result types: see above)", () => {
    void dqlParallel(db, [{ query: "a", size: 1 }], 4);
  });
});
