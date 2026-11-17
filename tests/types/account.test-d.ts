import { describe, expectTypeOf, it } from "vitest";
import { DiffbotClient, account, verifyToken, type AccountResponse } from "../../src/index.js";

declare const db: DiffbotClient;

describe("account()", () => {
  it("returns AccountResponse and verifyToken a boolean", () => {
    expectTypeOf(account(db)).resolves.toEqualTypeOf<AccountResponse>();
    expectTypeOf(account(db, { days: 1 })).resolves.toEqualTypeOf<AccountResponse>();
    expectTypeOf(verifyToken(db)).resolves.toEqualTypeOf<boolean>();
  });

  it("exposes the spec's fields", () => {
    expectTypeOf<AccountResponse["plan"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AccountResponse["childTokens"]>().toEqualTypeOf<string[] | undefined>();
  });
});
