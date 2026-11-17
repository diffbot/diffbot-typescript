import { describe, expectTypeOf, it } from "vitest";
import type { AccountOptions } from "../../src/account.js";
import type { CrawlDownloadOptions } from "../../src/crawl.js";
import type {
  AnalyzeExtractOptions,
  ArticleExtractOptions,
  CustomExtractOptions,
  DiscussionExtractOptions,
  EventExtractOptions,
  ImageExtractOptions,
  JobExtractOptions,
  ListExtractOptions,
  ProductExtractOptions,
  VideoExtractOptions,
} from "../../src/extract.js";
import type { operations as AccountOps } from "../../src/generated/account.js";
import type { operations as CrawlOps } from "../../src/generated/crawl.js";
import type { operations as ExtractOps } from "../../src/generated/extract.js";

/*
 * Contract: for every in-scope operation, the option keys the SDK names, plus an explicit
 * INTENTIONALLY_UNNAMED list, must equal the parameter keys in the vendored spec. A param
 * added to a spec (after `pnpm gen:types`) fails here until it is named or consciously
 * allow-listed; a name that is not in the spec fails too. `extra` is not a wire key.
 *
 * Only S1 operations are covered. DQL's named params arrive in S2.
 */

type Named<O> = Exclude<keyof O & string, "extra">;
type SpecKeys<Q> = keyof NonNullable<Q> & string;

// Cut or positional parameters. Why each is not a named option:
//   url / name   positional arguments of the function
//   callback     JSONP, pointless for an SDK (plan §6)
//   proxy, proxyAuth  credential-bearing and niche; typed `extra` only
type ExtractUnnamed = "url" | "callback" | "proxy" | "proxyAuth";

describe("spec <-> named option contract", () => {
  it("extract: analyze", () => {
    expectTypeOf<Named<AnalyzeExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["extract-analyze"]["parameters"]["query"]>
    >();
  });
  it("extract: article", () => {
    expectTypeOf<Named<ArticleExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["article"]["parameters"]["query"]>
    >();
  });
  it("extract: product", () => {
    expectTypeOf<Named<ProductExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["product"]["parameters"]["query"]>
    >();
  });
  it("extract: discussion", () => {
    expectTypeOf<Named<DiscussionExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["discussion"]["parameters"]["query"]>
    >();
  });
  it("extract: job, image, video, list, event", () => {
    expectTypeOf<Named<JobExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["job"]["parameters"]["query"]>
    >();
    expectTypeOf<Named<ImageExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["image"]["parameters"]["query"]>
    >();
    expectTypeOf<Named<VideoExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["video"]["parameters"]["query"]>
    >();
    expectTypeOf<Named<ListExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["list"]["parameters"]["query"]>
    >();
    expectTypeOf<Named<EventExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["event"]["parameters"]["query"]>
    >();
  });
  it("extract: custom API", () => {
    expectTypeOf<Named<CustomExtractOptions> | ExtractUnnamed>().toEqualTypeOf<
      SpecKeys<ExtractOps["customget"]["parameters"]["query"]>
    >();
  });

  it("account", () => {
    expectTypeOf<Named<AccountOptions>>().toEqualTypeOf<SpecKeys<AccountOps["account"]["parameters"]["query"]>>();
  });

  it("crawl data download", () => {
    // `name` is the positional job name.
    expectTypeOf<Named<CrawlDownloadOptions> | "name">().toEqualTypeOf<
      SpecKeys<CrawlOps["retrieve-crawl-job-data"]["parameters"]["query"]>
    >();
  });
});
