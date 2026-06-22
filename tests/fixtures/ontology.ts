import type { JsonObject } from "../../src/json.js";

export const FIXTURE_ONTOLOGY: JsonObject = {
  types: {
    Organization: {
      fields: {
        name: { type: "String" },
        location: { type: "Location", isComposite: true },
        oldField: { type: "String", isDeprecated: true },
      },
    },
    Person: { fields: { name: { type: "String" } } },
  },
  composites: {
    Location: { fields: { city: { type: "City", isComposite: true } } },
  },
  enums: { Language: { values: ["EN", "FR", "DE"] } },
  taxonomies: {
    OrganizationCategory: {
      categories: [
        { name: "Technology", children: [{ name: "Semiconductor Companies" }] },
      ],
    },
  },
};
