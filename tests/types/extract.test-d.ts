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
