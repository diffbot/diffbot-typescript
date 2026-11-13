import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, dql, dqlParallel } from "../../src/index.js";
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
