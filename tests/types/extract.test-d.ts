import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, extract } from "../../src/index.js";
import type {
  AnalyzeObject,
  ArticleObject,
  CustomApiObject,
  DiscussionObject,
  EventObject,
  ExtractResponse,
  ImageObject,
  JobObject,
  ListObject,
  ProductObject,
  VideoObject,
} from "../../src/types/undocumented.js";

declare const db: DiffbotClient;

describe("extract() overloads", () => {
  it("defaults to the analyze api", () => {
    expectTypeOf(extract(db, "https://example.com")).resolves.toEqualTypeOf<
      ExtractResponse<AnalyzeObject>
    >();
  });

  it("narrows the return type per built-in api", () => {
    expectTypeOf(extract(db, "https://example.com", "article")).resolves.toEqualTypeOf<
      ExtractResponse<ArticleObject>
    >();
    expectTypeOf(extract(db, "https://example.com", "product")).resolves.toEqualTypeOf<
      ExtractResponse<ProductObject>
    >();
    expectTypeOf(extract(db, "https://example.com", "discussion")).resolves.toEqualTypeOf<
      ExtractResponse<DiscussionObject>
    >();
    expectTypeOf(extract(db, "https://example.com", "job")).resolves.toEqualTypeOf<
      ExtractResponse<JobObject>
    >();
    expectTypeOf(extract(db, "https://example.com", "image")).resolves.toEqualTypeOf<
      ExtractResponse<ImageObject>
    >();
    expectTypeOf(extract(db, "https://example.com", "video")).resolves.toEqualTypeOf<
      ExtractResponse<VideoObject>
    >();
    expectTypeOf(extract(db, "https://example.com", "list")).resolves.toEqualTypeOf<
      ExtractResponse<ListObject>
    >();
    expectTypeOf(extract(db, "https://example.com", "event")).resolves.toEqualTypeOf<
      ExtractResponse<EventObject>
    >();
  });

  it("falls back to an open object shape for a Custom API name", () => {
    expectTypeOf(extract(db, "https://example.com", "my-custom-api")).resolves.toEqualTypeOf<
      ExtractResponse<CustomApiObject>
    >();
  });
});

describe("extract() options", () => {
  it("types fields per API", () => {
    void extract(db, "u", "article", "json", { fields: ["links", "quotes"] });
    // @ts-expect-error -- "quotes" is an article-only field.
    void extract(db, "u", "product", "json", { fields: ["quotes"] });
    // @ts-expect-error -- fields is a list, not a comma-joined string.
    void extract(db, "u", "article", "json", { fields: "links,meta" });
  });

  it("rejects options that belong to another API", () => {
    // @ts-expect-error -- `paging` is not an option of the product API.
    void extract(db, "u", "product", "json", { paging: true });
    // @ts-expect-error -- `callback` (JSONP) is intentionally not exposed.
    void extract(db, "u", "article", "json", { callback: "cb" });
  });

  it("rejects named options in extra but allows proxy/proxyAuth", () => {
    void extract(db, "u", "article", "json", { extra: { proxy: "h:1", proxyAuth: "u:p" } });
    // @ts-expect-error -- `timeout` is a named option.
    void extract(db, "u", "article", "json", { extra: { timeout: "1" } });
  });

  it("keeps the return type per API with options", () => {
    expectTypeOf(extract(db, "u", "article", "json", { timeout: 1 })).resolves.toEqualTypeOf<
      ExtractResponse<ArticleObject>
    >();
    expectTypeOf(extract(db, "u", undefined, undefined, { mode: "article" })).resolves.toEqualTypeOf<
      ExtractResponse<AnalyzeObject>
    >();
  });
});
