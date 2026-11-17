import { describe, expect, it } from "vitest";
import {
  APIError,
  AuthError,
  CrawlEventType,
  DiffbotClient,
  JobError,
  crawl,
  crawlDeleteJob,
  crawlDownload,
  crawlGetJob,
  crawlListJobs,
} from "../src/index.js";
import { createMockFetch, jsonResponse, type MockHandler } from "./helpers/mock-fetch.js";

function makeClient(handler: MockHandler): DiffbotClient {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("crawl", () => {
  it("returns a JOB_CREATED event", async () => {
    const db = makeClient(() =>
      jsonResponse({
        response: "Successfully added urls for spidering.",
        jobs: [{ name: "test-job" }],
      }),
    );
    const iterator = crawl(db, "https://example.com", { jobName: "test-job" });
    const { value: event } = await iterator.next();
    expect(event!.eventType).toBe(CrawlEventType.JobCreated);
    expect(event!.details.job_name).toBe("test-job");
  });

  it("sends token and seeds", async () => {
    let params: URLSearchParams | undefined;
    const db = makeClient((req) => {
      params = req.params;
      return jsonResponse({ jobs: [{ name: "test-job" }] });
    });
    await crawl(db, "https://example.com", { jobName: "test-job" }).next();
    expect(params!.get("token")).toBe("test-token");
    expect(params!.get("seeds")).toBe("https://example.com");
  });

  it("normalizes the url", async () => {
    let seeds = "";
    const db = makeClient((req) => {
      seeds = req.params.get("seeds") ?? "";
      return jsonResponse({ jobs: [{ name: "test-job" }] });
    });
    await crawl(db, "example.com", { jobName: "test-job" }).next();
    expect(seeds).toBe("https://example.com");
  });

  it("raises APIError when create answers HTTP 200 with an errorCode", async () => {
    const db = makeClient(() => jsonResponse({ errorCode: 505, error: "name is over 30 chars" }));
    const iterator = crawl(db, "https://example.com", { jobName: "x".repeat(31) });
    const error: unknown = await iterator.next().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(APIError);
    expect(error).toMatchObject({ statusCode: 200, apiMessage: "name is over 30 chars" });
  });

  it("raises AuthError on 401", async () => {
    const db = makeClient(() =>
      jsonResponse(
        {
          code: 401,
          message: "Unauthorized",
          requestId: "123456789",
          error: "Not authorized API token.",
          errorCode: 401,
        },
        401,
      ),
    );
    await expect(crawl(db, "https://example.com").next()).rejects.toMatchObject({
      name: "AuthError",
      statusCode: 401,
      apiMessage: "Unauthorized",
      requestId: "123456789",
    });
    await expect(crawl(db, "https://example.com").next()).rejects.toBeInstanceOf(AuthError);
  });

  it("raises JobError when a watched job reports failure, parsing quoted CSV fields", async () => {
    let call = 0;
    const db = makeClient(() => {
      call++;
      switch (call) {
        case 1: // crawl creation
          return jsonResponse({ jobs: [{ name: "test-job" }] });
        case 2: // status poll, iteration 1: still in progress
          return jsonResponse({ jobs: [{ name: "test-job", jobStatus: { status: 7 } }] });
        case 3: // URL report, iteration 1
          return new Response(
            'Url,Crawled Time,Crawl Status\n"https://example.com/a,b",t,200\n',
            { status: 200, headers: { "Content-Type": "text/csv" } },
          );
        case 4: // status poll, iteration 2: failed
          return jsonResponse({
            jobs: [{ name: "test-job", jobStatus: { status: 10, message: "crawl failed: timeout" } }],
          });
        default: // URL report, iteration 2 — read before the failure is raised
          return new Response("Url,Crawled Time,Crawl Status\n", {
            status: 200,
            headers: { "Content-Type": "text/csv" },
          });
      }
    });

    const events: Array<{ details: Record<string, unknown> }> = [];
    await expect(
      (async () => {
        for await (const event of crawl(db, "https://example.com", {
          jobName: "test-job",
          watch: true,
          pollInterval: 0,
        })) {
          events.push(event);
        }
      })(),
    ).rejects.toBeInstanceOf(JobError);

    const urlEvent = events.find((e) => "url" in e.details);
    // The quoted field "https://example.com/a,b" must survive as one URL, not be split on its comma.
    expect(urlEvent?.details.url).toBe("https://example.com/a,b");
  });

  it("crawlGetJob returns undefined for a missing job, not {}", async () => {
    const db = makeClient(() => jsonResponse({ jobs: [] }));
    expect(await crawlGetJob(db, "nope")).toBeUndefined();
  });

  it("crawlGetJob returns the job record when found", async () => {
    const db = makeClient(() => jsonResponse({ jobs: [{ name: "test-job" }] }));
    expect(await crawlGetJob(db, "test-job")).toEqual({ name: "test-job" });
  });

  it("crawlListJobs returns an empty array when there are no jobs", async () => {
    const db = makeClient(() => jsonResponse({ jobs: [] }));
    expect(await crawlListJobs(db)).toEqual([]);
  });

  it("does not retry crawlDeleteJob (a GET-shaped mutation)", async () => {
    let calls = 0;
    const db = new DiffbotClient({
      token: "test-token",
      retry: { baseDelayMs: 1, maxDelayMs: 1 },
      fetch: createMockFetch(() => {
        calls++;
        return new Response("", { status: 503 });
      }),
    });
    await expect(crawlDeleteJob(db, "test-job")).rejects.toMatchObject({ statusCode: 503 });
    expect(calls).toBe(1);
  });
});

describe("crawlDownload", () => {
  it("GETs /v3/crawl/data with name only by default and parses JSON records", async () => {
    const db = makeClient((req) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("https://api.diffbot.com/v3/crawl/data");
      expect(req.params.get("token")).toBe("test-token");
      expect(req.params.get("name")).toBe("job1");
      expect(req.params.has("format")).toBe(false);
      expect(req.params.has("type")).toBe(false);
      expect(req.params.has("num")).toBe(false);
      return jsonResponse([{ col: "job1", pageUrl: "https://example.com/", type: "other" }]);
    });
    const records = await crawlDownload(db, "job1");
    expect(records).toEqual([{ col: "job1", pageUrl: "https://example.com/", type: "other" }]);
  });

  it("returns CSV text for format: csv and forwards type/num", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("format")).toBe("csv");
      expect(req.params.get("num")).toBe("5");
      return new Response("pageUrl,title\nhttps://example.com/,Example\n", { status: 200 });
    });
    const csv = await crawlDownload(db, "job1", { format: "csv", num: 5 });
    expect(csv).toBe("pageUrl,title\nhttps://example.com/,Example\n");
  });

  it("returns the URL report as text (type: urls)", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("type")).toBe("urls");
      expect(req.params.has("format")).toBe(false);
      return new Response("Url,Crawled Time,Crawl Status\n", { status: 200 });
    });
    expect(await crawlDownload(db, "job1", { type: "urls" })).toBe("Url,Crawled Time,Crawl Status\n");
  });

  it("returns [] for an empty JSON body", async () => {
    const db = makeClient(() => new Response("", { status: 200 }));
    expect(await crawlDownload(db, "job1")).toEqual([]);
  });

  it("raises on a 400 for an unknown job and on a 200 error object", async () => {
    const missing = makeClient(() => jsonResponse({ errorCode: 400, error: "No collection record" }, 400));
    await expect(crawlDownload(missing, "nope")).rejects.toMatchObject({ statusCode: 400 });
    const odd = makeClient(() => jsonResponse({ errorCode: 400, error: "No collection record" }));
    await expect(crawlDownload(odd, "nope")).rejects.toBeInstanceOf(JobError);
  });
});
