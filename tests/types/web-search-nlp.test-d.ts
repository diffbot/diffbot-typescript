import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, entities, webSearch } from "../../src/index.js";
import type { EntitiesResponse } from "../../src/nlp.js";
import type { WebSearchResponse } from "../../src/types/web-search.js";

declare const db: DiffbotClient;

describe("webSearch()/entities() types", () => {
  it("webSearch resolves to a typed WebSearchResponse", () => {
    expectTypeOf(webSearch(db, "diffbot")).resolves.toEqualTypeOf<WebSearchResponse>();
  });

  it("entities resolves to just the two fields it always requests", () => {
    expectTypeOf(entities(db, "some text")).resolves.toEqualTypeOf<EntitiesResponse>();
    expectTypeOf<keyof EntitiesResponse>().toEqualTypeOf<"entities" | "sentiment">();
  });
});
