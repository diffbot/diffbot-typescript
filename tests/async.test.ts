import { describe, expect, it } from "vitest";
import { AuthError, CrawlEventType, DiffbotAsync } from "../src/index.js";
import { createMockFetch, jsonResponse, type MockHandler } from "./helpers/mock-fetch.js";
import type { CrawlEvent } from "../src/index.js";

function makeClient(handler: MockHandler): DiffbotAsync {
  return new DiffbotAsync({ token: "test-token", fetch: createMockFetch(handler) });
}

describe("DiffbotAsync", () => {
  it("extract returns a dict", async () => {
    const db = makeClient((req) => {
      expect(req.params.get("token")).toBe("test-token");
      expect(req.params.get("url")).toBe("https://example.com");
      return jsonResponse({ objects: [{ title: "Example" }] });
    });
    const result = await db.extract("https://example.com");
    expect(result).toEqual({ objects: [{ title: "Example" }] });
  });

  it("crawl yields JOB_CREATED", async () => {
    const db = makeClient(() => jsonResponse({ jobs: [{ name: "test-job" }] }));
    const events: CrawlEvent[] = [];
    for await (const event of db.crawl("https://example.com", { jobName: "test-job" })) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe(CrawlEventType.JobCreated);
    expect(events[0]!.details.job_name).toBe("test-job");
  });

  it("disposal closes the client", async () => {
    let db: DiffbotAsync;
    {
      await using scoped = new DiffbotAsync({
        token: "t",
        fetch: createMockFetch(() => jsonResponse({})),
      });
      db = scoped;
      await scoped.extract("example.com");
    }
    expect(db.http.isClosed).toBe(true);
  });

  it("raises AuthError", async () => {
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
    await expect(db.extract("https://example.com")).rejects.toMatchObject({
      name: "AuthError",
      statusCode: 401,
      apiMessage: "Unauthorized",
      requestId: "123456789",
    });
    await expect(db.extract("https://example.com")).rejects.toBeInstanceOf(AuthError);
  });
});
