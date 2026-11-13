import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, crawlGetJob, crawlListJobs } from "../../src/index.js";
import type { CrawlJob } from "../../src/types/undocumented.js";

declare const db: DiffbotClient;

describe("crawl job accessors", () => {
  it("crawlListJobs resolves to an array of CrawlJob", () => {
    expectTypeOf(crawlListJobs(db)).resolves.toEqualTypeOf<CrawlJob[]>();
  });

  it("crawlGetJob resolves to CrawlJob | undefined, not {}", () => {
    expectTypeOf(crawlGetJob(db, "name")).resolves.toEqualTypeOf<CrawlJob | undefined>();
  });
});
