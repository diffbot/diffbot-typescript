/**
 * Generated from openapi/natural-language.json by `pnpm gen:types`. Do not hand-edit.
 * Source: openapi-typescript v7.13.0
 */
export interface paths {
    "/v1/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Process Text */
        post: {
            parameters: {
                query?: {
                    /** @description Attributes to include in response */
                    fields?: ("entities" | "sentiment" | "facts" | "records" | "categories" | "sentences" | "language" | "summary")[];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description documents to be processed */
            requestBody: {
                content: {
                    "application/json": components["schemas"]["DocumentArray"];
                    "application/x-www-form-urlencoded": components["schemas"]["DocumentArray"];
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["NaturalLanguageResponseArray"];
                    };
                };
                /** @description Invalid input */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /**
         * @example {
         *       "content": "Diffbot is a startup based in Menlo Park."
         *     }
         */
        Document: {
            /**
             * Format: blob
             * @description The text you'd like Diffbot Natural Language to process.
             */
            content: string;
            /**
             * @description Language of the text specified as an [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes). Review our supported languages for more information.
             * @default auto
             */
            lang: string;
            /**
             * @description `plain text` for free text. `plain text with title` includes a title separated from the body by two line breaks (e.g. "This is a title\n\nThis is the body").
             * @default plain text
             * @enum {string}
             */
            format: "plain text" | "plain text with title";
            /**
             * @description Optional. Provides context to the model and may produce better results.
             * @enum {string}
             */
            documentType?: "organization bio" | "person bio" | "news article" | "address" | "discussion";
            customSummary?: components["schemas"]["CustomSummary"];
        };
        /**
         * @example [
         *       {
         *         "content": "Diffbot is a startup based in Menlo Park."
         *       }
         *     ]
         */
        DocumentArray: components["schemas"]["Document"][];
        EntityWithMentions: {
            name?: string;
            diffbotUri?: string;
            /** Format: float */
            confidence?: number;
            /** Format: float */
            salience?: number;
            /** Format: float */
            sentiment?: number;
            allUris?: string[];
            allTypes?: components["schemas"]["EntityType"][];
            mentions?: components["schemas"]["Mention"][];
            location?: components["schemas"]["Location"];
        };
        Mention: {
            text?: string;
            beginOffset?: number;
            endOffset?: number;
            isPronoun?: boolean;
            /** Format: float */
            confidence?: number;
        };
        Entity: {
            name?: string;
            diffbotUri?: string;
            /** Format: float */
            confidence?: number;
            allUris?: string[];
            allTypes?: components["schemas"]["EntityType"][];
            isCustom?: boolean;
            /** @description Index of this entity in the field "entities" (if requested) */
            entityIndex?: number;
        };
        Span: {
            beginOffset?: number;
            endOffset?: number;
        };
        Fact: {
            humanReadable?: string;
            entity?: components["schemas"]["Entity"];
            property?: components["schemas"]["Property"];
            value?: components["schemas"]["Entity"];
            qualifiers?: components["schemas"]["Qualifier"][];
            /** Format: float */
            confidence?: number;
            evidence?: components["schemas"]["Evidence"][];
        };
        /** @description https://demo.nl.diffbot.com/schema/#qualifiers */
        Qualifier: {
            property?: components["schemas"]["Property"];
            value?: components["schemas"]["Qualifier_value"];
            /** Format: float */
            confidence?: number;
        };
        /** @description https://demo.nl.diffbot.com/schema/#properties */
        Property: {
            name?: string;
            diffbotUri?: string;
            description?: string;
        };
        /** @description https://demo.nl.diffbot.com/schema/#types */
        EntityType: {
            name?: string;
            diffbotUri?: string;
            dbpediaUri?: string;
        };
        Evidence: {
            /** @description One or more sentences where the fact was extracted from */
            passage?: string;
            entityMentions?: components["schemas"]["Mention"][];
            valueMentions?: components["schemas"]["Mention"][];
        };
        Location: {
            /** Format: float */
            latitude?: number;
            /** Format: float */
            longitude?: number;
            /** Format: float */
            precision?: number;
        };
        Category: {
            id?: string;
            name?: string;
            path?: string;
            /** Format: float */
            confidence?: number;
            isPrimary?: boolean;
        };
        /** @description https://demo.nl.diffbot.com/schema/#categories */
        Categorization: {
            iabv1?: components["schemas"]["Category"][];
            iabv2?: components["schemas"]["Category"][];
            diffbot?: components["schemas"]["Category"][];
        };
        /** @description Define custom parameters for summary generation. */
        CustomSummary: {
            /**
             * Format: int32
             * @description Maximum number of sentences for the generated summary.
             * @default 3
             */
            maxNumberOfSentences: number;
        };
        NaturalLanguageResponse: {
            errors?: string[];
            entities?: components["schemas"]["EntityWithMentions"][];
            /** Format: float */
            sentiment?: number;
            facts?: components["schemas"]["Fact"][];
            /** @description Array of entities with attributes extracted from inputDocument according to the KG schema (https://docs.diffbot.com/docs/ontology) */
            records?: Record<string, never>[];
            categories?: components["schemas"]["Categorization"];
            sentences?: components["schemas"]["Span"][];
            /** @description Language of the text specified as an [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes). */
            language?: string;
            /** @description Generated summary. */
            summary?: string;
        };
        /**
         * @example [
         *       {
         *         "sentiment": 0,
         *         "entities": [
         *           {
         *             "name": "Diffbot",
         *             "diffbotUri": "https://diffbot.com/entity/EYX1i02YVPsuT7fPLUYgRhQ",
         *             "confidence": 0.99898225,
         *             "salience": 0.95394653,
         *             "sentiment": 0,
         *             "isCustom": false,
         *             "allUris": [
         *               "http://www.wikidata.org/entity/Q17052069"
         *             ],
         *             "allTypes": [
         *               {
         *                 "name": "organization",
         *                 "diffbotUri": "https://diffbot.com/entity/EN1ClYEdMMQCxB6AWTkT3mA",
         *                 "dbpediaUri": "http://dbpedia.org/ontology/Organisation"
         *               }
         *             ],
         *             "mentions": [
         *               {
         *                 "text": "Diffbot",
         *                 "beginOffset": 0,
         *                 "endOffset": 7,
         *                 "confidence": 0.99898225
         *               }
         *             ],
         *             "location": {
         *               "latitude": 37.456104,
         *               "longitude": -122.1763,
         *               "precision": 0.1
         *             }
         *           },
         *           {
         *             "name": "Menlo Park",
         *             "diffbotUri": "https://diffbot.com/entity/EQiAUr370NpW1gvx-V4fTrQ",
         *             "confidence": 0.9996269,
         *             "salience": 0.9082091,
         *             "sentiment": 0,
         *             "isCustom": false,
         *             "allUris": [
         *               "http://www.wikidata.org/entity/Q74195"
         *             ],
         *             "allTypes": [
         *               {
         *                 "name": "location",
         *                 "diffbotUri": "https://diffbot.com/entity/EiCyWUm4lNziqgLHx47iAIQ",
         *                 "dbpediaUri": "http://dbpedia.org/ontology/Place"
         *               },
         *               {
         *                 "name": "administrative area",
         *                 "diffbotUri": "https://diffbot.com/entity/EcTIu1tWKPouIa6qZtSpc4A",
         *                 "dbpediaUri": "http://dbpedia.org/ontology/PopulatedPlace"
         *               },
         *               {
         *                 "name": "city",
         *                 "diffbotUri": "https://diffbot.com/entity/EzdJrGHiyMWu0XbSn101rFA",
         *                 "dbpediaUri": "http://dbpedia.org/ontology/City"
         *               }
         *             ],
         *             "mentions": [
         *               {
         *                 "text": "Menlo Park",
         *                 "beginOffset": 30,
         *                 "endOffset": 40,
         *                 "confidence": 0.9996269
         *               }
         *             ],
         *             "location": {
         *               "latitude": 37.454166,
         *               "longitude": -122.17861,
         *               "precision": 6.708204
         *             }
         *           },
         *           {
         *             "name": "startup company",
         *             "diffbotUri": "https://diffbot.com/entity/EfX0EeXroOmaXrLe-SylIuw",
         *             "confidence": 0.81958973,
         *             "salience": 0.6474858,
         *             "sentiment": 0,
         *             "isCustom": false,
         *             "allUris": [],
         *             "mentions": [
         *               {
         *                 "text": "startup",
         *                 "beginOffset": 13,
         *                 "endOffset": 20,
         *                 "confidence": 0.81958973
         *               }
         *             ]
         *           }
         *         ],
         *         "facts": [
         *           {
         *             "humanReadable": "[Diffbot] headquarters [Menlo Park]",
         *             "entity": {
         *               "name": "Diffbot",
         *               "diffbotUri": "https://diffbot.com/entity/EYX1i02YVPsuT7fPLUYgRhQ",
         *               "confidence": 0.99898225,
         *               "allUris": [
         *                 "http://www.wikidata.org/entity/Q17052069"
         *               ],
         *               "allTypes": [
         *                 {
         *                   "name": "organization",
         *                   "diffbotUri": "https://diffbot.com/entity/EN1ClYEdMMQCxB6AWTkT3mA",
         *                   "dbpediaUri": "http://dbpedia.org/ontology/Organisation"
         *                 }
         *               ],
         *               "isCustom": false,
         *               "entityIndex": 1
         *             },
         *             "property": {
         *               "name": "headquarters",
         *               "diffbotUri": "https://docs.diffbot.com/docs/ont-organization#location"
         *             },
         *             "value": {
         *               "name": "Menlo Park",
         *               "diffbotUri": "https://diffbot.com/entity/EQiAUr370NpW1gvx-V4fTrQ",
         *               "confidence": 0.9996269,
         *               "allUris": [
         *                 "http://www.wikidata.org/entity/Q74195"
         *               ],
         *               "allTypes": [
         *                 {
         *                   "name": "location",
         *                   "diffbotUri": "https://diffbot.com/entity/EiCyWUm4lNziqgLHx47iAIQ",
         *                   "dbpediaUri": "http://dbpedia.org/ontology/Place"
         *                 },
         *                 {
         *                   "name": "administrative area",
         *                   "diffbotUri": "https://diffbot.com/entity/EcTIu1tWKPouIa6qZtSpc4A",
         *                   "dbpediaUri": "http://dbpedia.org/ontology/PopulatedPlace"
         *                 },
         *                 {
         *                   "name": "city",
         *                   "diffbotUri": "https://diffbot.com/entity/EzdJrGHiyMWu0XbSn101rFA",
         *                   "dbpediaUri": "http://dbpedia.org/ontology/City"
         *                 }
         *               ],
         *               "isCustom": false,
         *               "entityIndex": 0
         *             },
         *             "qualifiers": [
         *               {
         *                 "property": {
         *                   "name": "is current"
         *                 },
         *                 "value": {
         *                   "name": "true"
         *                 },
         *                 "confidence": 0
         *               }
         *             ],
         *             "confidence": 0.95,
         *             "evidence": [
         *               {
         *                 "passage": "Diffbot is a startup based in Menlo Park.",
         *                 "entityMentions": [
         *                   {
         *                     "text": "Diffbot",
         *                     "beginOffset": 0,
         *                     "endOffset": 7,
         *                     "confidence": 0.99898225
         *                   }
         *                 ],
         *                 "valueMentions": [
         *                   {
         *                     "text": "Menlo Park",
         *                     "beginOffset": 30,
         *                     "endOffset": 40,
         *                     "confidence": 0.9996269
         *                   }
         *                 ]
         *               }
         *             ]
         *           }
         *         ]
         *       }
         *     ]
         */
        NaturalLanguageResponseArray: components["schemas"]["NaturalLanguageResponse"][];
        ErrorResponse: {
            messages?: string[];
        };
        Qualifier_value: {
            name?: string;
            diffbotUri?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
