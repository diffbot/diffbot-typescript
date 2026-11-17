import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, crawlDownload, crawlGetJob, crawlListJobs, type CrawlOptions } from "../../src/index.js";
import type { CrawlDataRecord, CrawlJob } from "../../src/types/undocumented.js";

declare const db: DiffbotClient;

describe("crawl job accessors", () => {
  it("crawlListJobs resolves to an array of CrawlJob", () => {
    expectTypeOf(crawlListJobs(db)).resolves.toEqualTypeOf<CrawlJob[]>();
  });

  it("crawlGetJob resolves to CrawlJob | undefined, not {}", () => {
    expectTypeOf(crawlGetJob(db, "name")).resolves.toEqualTypeOf<CrawlJob | undefined>();
  });
});

describe("crawlDownload overloads", () => {
  it("returns records by default and for format: json", () => {
    expectTypeOf(crawlDownload(db, "n")).resolves.toEqualTypeOf<CrawlDataRecord[]>();
    expectTypeOf(crawlDownload(db, "n", { format: "json", num: 3 })).resolves.toEqualTypeOf<CrawlDataRecord[]>();
  });

  it("returns a string for format: csv and for the CSV-only URL report", () => {
    expectTypeOf(crawlDownload(db, "n", { format: "csv" })).resolves.toEqualTypeOf<string>();
    expectTypeOf(crawlDownload(db, "n", { type: "urls" })).resolves.toEqualTypeOf<string>();
  });
});

describe("crawl() customHeaders", () => {
  it("accepts a string or a readonly string array", () => {
    expectTypeOf<CrawlOptions["customHeaders"]>().toEqualTypeOf<string | readonly string[] | undefined>();
  });
});
