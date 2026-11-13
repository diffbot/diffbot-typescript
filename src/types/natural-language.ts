/** Hand-written facade over `src/generated/natural-language.ts`. */
import type { components } from "../generated/natural-language.js";
import type { JsonObject } from "../json.js";

export type NaturalLanguageResponse = components["schemas"]["NaturalLanguageResponse"];
export type NlpDocument = components["schemas"]["Document"];
export type NlpField = "entities" | "sentiment" | "facts" | "records" | "categories" | "sentences" | "language" | "summary";

type _NaturalLanguageResponseIsJsonObject = NaturalLanguageResponse extends JsonObject ? true : never;
const _naturalLanguageResponseIsJsonObject: _NaturalLanguageResponseIsJsonObject = true;
