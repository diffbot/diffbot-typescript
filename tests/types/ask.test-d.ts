import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, ask, askJson, type ChatMessage } from "../../src/index.js";

declare const db: DiffbotClient;

describe("ask()/askJson() types", () => {
  it("ChatMessage.role is a closed union, not a bare string", () => {
    expectTypeOf<ChatMessage["role"]>().toEqualTypeOf<"system" | "user" | "assistant">();
  });

  it("ask() yields strings", () => {
    expectTypeOf(ask(db, [{ role: "user", content: "hi" }])).toEqualTypeOf<AsyncGenerator<string>>();
  });

  it("askJson defaults to unknown without a parse hook or explicit T", () => {
    expectTypeOf(askJson(db, [{ role: "user", content: "hi" }])).resolves.toEqualTypeOf<unknown>();
  });

  it("askJson narrows T from an explicit type parameter", () => {
    expectTypeOf(
      askJson<{ capital: string }>(db, [{ role: "user", content: "hi" }]),
    ).resolves.toEqualTypeOf<{ capital: string }>();
  });

  it("askJson narrows T from the parse hook's return type", () => {
    expectTypeOf(
      askJson(db, [{ role: "user", content: "hi" }], undefined, {
        parse: (value: unknown) => ({ capital: String(value) }),
      }),
    ).resolves.toEqualTypeOf<{ capital: string }>();
  });
});
