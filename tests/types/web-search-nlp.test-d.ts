import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, entities, nlp, webSearch } from "../../src/index.js";
import type { EntitiesResponse } from "../../src/nlp.js";
import type { NaturalLanguageResponse } from "../../src/types/natural-language.js";
import type { WebSearchResponse } from "../../src/types/web-search.js";

declare const db: DiffbotClient;

describe("webSearch()/entities() types", () => {
  it("webSearch accepts a string or a readonly string array, nothing else", () => {
    void webSearch(db, "a");
    void webSearch(db, ["a", "b"]);
    void webSearch(db, ["a", "b"] as const);
    // @ts-expect-error -- text must be strings.
    void webSearch(db, [1, 2]);
    // @ts-expect-error -- a bare number is not a query.
    void webSearch(db, 5);
    expectTypeOf(webSearch(db, ["a"])).resolves.toEqualTypeOf<WebSearchResponse>();
  });

  it("webSearch resolves to a typed WebSearchResponse", () => {
    expectTypeOf(webSearch(db, "diffbot")).resolves.toEqualTypeOf<WebSearchResponse>();
  });

  it("entities resolves to just the two fields it always requests", () => {
    expectTypeOf(entities(db, "some text")).resolves.toEqualTypeOf<EntitiesResponse>();
    expectTypeOf<keyof EntitiesResponse>().toEqualTypeOf<"entities" | "sentiment">();
  });
});

describe("nlp() types", () => {
  it("narrows the response to the requested fields", () => {
    expectTypeOf(nlp(db, "t", { fields: ["summary", "language"] })).resolves.toEqualTypeOf<
      Pick<NaturalLanguageResponse, "summary" | "language">
    >();
    expectTypeOf(nlp(db, "t", { fields: ["sentiment"] })).resolves.toEqualTypeOf<
      Pick<NaturalLanguageResponse, "sentiment">
    >();
  });

  it("requires fields and rejects unknown ones, formats and document types", () => {
    // @ts-expect-error -- fields is required.
    void nlp(db, "t", {});
    // @ts-expect-error -- not an NL field.
    void nlp(db, "t", { fields: ["nope"] });
    // @ts-expect-error -- not a supported format.
    void nlp(db, "t", { fields: ["summary"], format: "html" });
    // @ts-expect-error -- not a supported documentType.
    void nlp(db, "t", { fields: ["summary"], documentType: "blog" });
    void nlp(db, "t", {
      fields: ["summary"],
      format: "plain text with title",
      documentType: "news article",
      customSummary: { maxNumberOfSentences: 3 },
    });
  });
});
