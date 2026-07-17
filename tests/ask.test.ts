import { describe, expect, it } from "vitest";
import { DiffbotClient, ask } from "../src/index.js";
import { createMockFetch, jsonResponse, sseResponse } from "./helpers/mock-fetch.js";

function makeClient(handler: Parameters<typeof createMockFetch>[0]) {
  return new DiffbotClient({ token: "test-token", fetch: createMockFetch(handler) });
}

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const chunk of gen) out.push(chunk);
  return out;
}

const CHUNK = (content: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}`;

describe("ask", () => {
  it("sends a bearer token and streaming chat payload", async () => {
    let body = "";
    const db = makeClient((req) => {
      expect(req.headers.get("authorization")).toBe("Bearer test-token");
      body = req.body ?? "";
      return sseResponse(`${CHUNK("Hi")}\n`);
    });
    const chunks = await collect(ask(db, [{ role: "user", content: "hello" }]));
    expect(chunks).toEqual(["Hi"]);
    const parsed = JSON.parse(body);
    expect(parsed.stream).toBe(true);
    expect(parsed.messages).toEqual([{ role: "user", content: "hello" }]);
  });

  it("skips malformed and contentless chunks", async () => {
    const db = makeClient(() =>
      sseResponse([CHUNK("Hello "), "data: not-json", "data: {}", CHUNK("world")].join("\n")),
    );
    expect((await collect(ask(db, [{ role: "user", content: "x" }]))).join("")).toBe("Hello world");
  });

  it("falls back to text when the response has no body stream", async () => {
    const db = makeClient(() => {
      const res = new Response(`${CHUNK("from")}\n${CHUNK(" text")}`, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
      Object.defineProperty(res, "body", { value: null });
      return res;
    });
    expect((await collect(ask(db, [{ role: "user", content: "x" }]))).join("")).toBe("from text");
  });

  it("raises on error status", async () => {
    const db = makeClient(() => jsonResponse({ code: 401, message: "nope" }, 401));
    await expect(collect(ask(db, [{ role: "user", content: "x" }]))).rejects.toMatchObject({
      name: "AuthError",
    });
  });
});
