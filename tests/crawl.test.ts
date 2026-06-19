import { describe, expect, it } from "vitest";
import { AuthError, CrawlEventType, Diffbot } from "../src/index.js";
import { createMockFetch, jsonResponse, type MockHandler } from "./helpers/mock-fetch.js";

function makeClient(handler: MockHandler): Diffbot {
  return new Diffbot({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("crawl", () => {
  it("returns a JOB_CREATED event", async () => {
    const db = makeClient(() =>
      jsonResponse({
        response: "Successfully added urls for spidering.",
        jobs: [{ name: "test-job" }],
      }),
    );
    const iterator = db.crawl("https://example.com", { jobName: "test-job" });
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
    await db.crawl("https://example.com", { jobName: "test-job" }).next();
    expect(params!.get("token")).toBe("test-token");
    expect(params!.get("seeds")).toBe("https://example.com");
  });

  it("normalizes the url", async () => {
    let seeds = "";
    const db = makeClient((req) => {
      seeds = req.params.get("seeds") ?? "";
      return jsonResponse({ jobs: [{ name: "test-job" }] });
    });
    await db.crawl("example.com", { jobName: "test-job" }).next();
    expect(seeds).toBe("https://example.com");
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
    await expect(db.crawl("https://example.com").next()).rejects.toMatchObject({
      name: "AuthError",
      statusCode: 401,
      apiMessage: "Unauthorized",
      requestId: "123456789",
    });
    await expect(db.crawl("https://example.com").next()).rejects.toBeInstanceOf(AuthError);
  });
});
