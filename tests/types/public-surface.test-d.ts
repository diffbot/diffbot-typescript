import { describe, expectTypeOf, it } from "vitest";
import type * as publicApi from "../../src/index.js";

// Enhance / Bulk Extract / Custom API are infra only (vendored specs + src/generated),
// not part of the public SDK surface. This fails if one leaks into src/index.ts.
type ForbiddenExport = Extract<
  keyof typeof publicApi,
  `${string}${"enhance" | "Enhance" | "bulk" | "Bulk" | "custom" | "Custom"}${string}`
>;

describe("public surface", () => {
  it("exports no enhance/bulk/custom symbols", () => {
    // `CustomApiObject` (the open-shape extract result for custom APIs) is the one allowed
    // name; it is a response type, not a Custom API management function.
    expectTypeOf<Exclude<ForbiddenExport, "CustomApiObject">>().toEqualTypeOf<never>();
  });
});
