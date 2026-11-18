import { describe, expectTypeOf, it } from "vitest";
import { Ontology } from "../../src/index.js";
import type { FieldMeta, OntologyDocument } from "../../src/types/undocumented.js";

describe("Ontology types", () => {
  it("fieldsFor resolves to a Record<string, FieldMeta>", () => {
    const ontology = new Ontology({} as OntologyDocument);
    expectTypeOf(ontology.fieldsFor("Article")).toEqualTypeOf<Record<string, FieldMeta>>();
  });

  it("a hand-built ontology document satisfies OntologyDocument", () => {
    // The `satisfies` clause is the assertion: this fails to compile if the literal
    // below doesn't conform to OntologyDocument's shape.
    const doc = {
      types: {
        Article: { fields: { title: { type: "String" } } },
      },
      enums: { Gender: { values: ["Male", "Female"] } },
    } satisfies OntologyDocument;
    expectTypeOf(doc.enums.Gender.values).toEqualTypeOf<string[]>();
  });
});
