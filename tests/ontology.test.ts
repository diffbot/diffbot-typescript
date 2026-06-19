import { describe, expect, it } from "vitest";
import { Diffbot, Ontology } from "../src/index.js";
import { FIXTURE_ONTOLOGY } from "./fixtures/ontology.js";
import { createMockFetch, jsonResponse } from "./helpers/mock-fetch.js";

describe("Ontology", () => {
  const ont = new Ontology(FIXTURE_ONTOLOGY);

  it("navigates types, composites, enums, taxonomies", () => {
    expect(ont.types()).toEqual(["Organization", "Person"]);
    expect(ont.composites()).toEqual(["Location"]);
    expect(ont.enums()).toEqual(["Language"]);
    expect(ont.taxonomies()).toEqual(["OrganizationCategory"]);
    expect(ont.enumValues("Language")).toEqual(["EN", "FR", "DE"]);
    expect(ont.taxonomyValues("OrganizationCategory", "semi")).toEqual(["Semiconductor Companies"]);
    expect(ont.findNamed("compan")).toEqual(["Semiconductor Companies"]);
  });

  it("routes fields_for for types and composites", () => {
    expect(ont.fieldsFor("Organization")).toHaveProperty("name");
    expect(ont.fieldsFor("Location")).toHaveProperty("city");
    expect(() => ont.fieldsFor("NopeType")).toThrow();
  });

  it("filters deprecated fields", () => {
    const fields = ont.fieldsFor("Organization");
    const names = Ontology.filterFields(fields, null).map(([n]) => n);
    expect(names).not.toContain("oldField");
    const incl = Ontology.filterFields(fields, null, true).map(([n]) => n);
    expect(incl).toContain("oldField");
  });

  it("formats fields", () => {
    const fields = ont.fieldsFor("Organization");
    expect(Ontology.formatField("location", fields.location!)).toBe("location: [Location] [isComposite]");
  });

  it("fetches ontology via client", async () => {
    const db = new Diffbot({
      token: "test-token",
      fetch: createMockFetch((req) => {
        expect(req.url.endsWith("/ontology") || req.url.includes("/ontology")).toBe(true);
        return jsonResponse(FIXTURE_ONTOLOGY);
      }),
    });
    const result = await db.dqlFetchOntology();
    expect(result).toBeInstanceOf(Ontology);
    expect(result.types()).toEqual(["Organization", "Person"]);
  });
});
