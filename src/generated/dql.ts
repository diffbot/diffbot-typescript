/**
 * Generated from openapi/dql.json by `pnpm gen:types`. Do not hand-edit.
 * Source: openapi-typescript v7.13.0
 */
export interface paths {
    "/kg/v3/dql": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search with DQL
         * @description Search the Knowledge Graph using DQL
         */
        get: operations["dqlGet"];
        put?: never;
        /**
         * Search with DQL
         * @description Search the Knowledge Graph using DQL
         */
        post: operations["dqlPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/dql/report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Coverage report by Query
         * @description Download coverage report by DQL query
         */
        get: operations["reportFind"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/dql/report/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Coverage report by ID
         * @description Download coverage report by report ID
         */
        get: operations["reportGet"];
        put?: never;
        post?: never;
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
        /** @description A single result */
        Data: {
            /**
             * Format: double
             * @description score
             * @example 0.75
             */
            score?: number;
            entity?: components["schemas"]["JSONObject"];
            /** @description Entity-level context */
            entity_ctx?: {
                [key: string]: Record<string, never>;
            };
            errors?: string[];
            /** @description The query for the facet */
            callbackQuery?: string;
            /**
             * Format: double
             * @description The upper bound of the facet
             */
            upperBound?: number;
            /**
             * Format: double
             * @description The lower bound of the facet
             */
            lowerBound?: number;
            /**
             * Format: int64
             * @description The count of the facet
             */
            count?: number;
            /** @description The value of the facet */
            value?: string;
            /** @description The uri of the facet value (for uri facets) */
            uri?: string;
        };
        DqlResponse: {
            /**
             * Format: int32
             * @description Response version
             * @example 3
             */
            version?: number;
            /** Format: int64 */
            hits?: number;
            /**
             * Format: int64
             * @description Number of results in this response
             * @example 50
             */
            results?: number;
            /**
             * @description Version of KG that was queried
             * @example 250
             */
            kgversion?: string;
            /**
             * @description Diffbot type of returned results
             * @example Organization
             */
            diffbot_type?: string;
            /** @description Was this a facet query? */
            facet?: boolean;
            /** @description Results of the query */
            data?: components["schemas"]["Data"][];
            rewrites?: components["schemas"]["Rewrite"][];
            /**
             * @description Whether the query fell back to text search.
             * @example false
             */
            textFallback?: boolean;
            /**
             * @description Identifier for the generated coverage report. Present only when `report=true` was passed.
             * @example C-4d87a965-b43f
             */
            reportId?: string;
        };
        /**
         * @description Entity. Can be null if no entity was found.
         * @example {
         *       "id": "EYX1i02YVPsuT7fPLUYgRhQ",
         *       "diffbotUri": "http://diffbot.com/entity/EYX1i02YVPsuT7fPLUYgRhQ",
         *       "name": "Diffbot",
         *       "origins": [
         *         "angel.co/diffbot",
         *         "bloomberg.com/profiles/companies/0506286D:US-diffbot-corp",
         *         "crunchbase.com/organization/diffbot",
         *         "linkedin.com/company/diffbot",
         *         "en.wikipedia.org/wiki/Diffbot"
         *       ]
         *     }
         */
        JSONObject: {
            empty?: boolean;
        };
        Rewrite: {
            query?: string;
            reason?: string;
        };
        DqlPostRequest: {
            /**
             * @description Query type
             * @default query
             * @enum {string}
             */
            type: "query" | "text" | "queryTextFallback" | "crawl";
            /** @description DQL Query */
            query: string;
            /** @description Comma-delimited list of custom crawl collections to query. Specify `all` to query all collections for your token. This parameter is valid only when type=crawl and defaults to `all` */
            col?: string;
            /**
             * Format: int32
             * @description Return results starting at `from` index. `from+size <= 10_000` for facet queries.
             *
             *     Please note that the from parameter is no longer applicable to Article queries and has been deprecated. In the future, using this parameter will result in an error.
             * @default 0
             */
            from: number;
            /**
             * Format: int32
             * @description Maximum number of results to return. `-1` to return all results. `from+size <= 10_000` for facet queries.
             * @default 50
             */
            size: number;
            /**
             * @description Output format
             * @default json
             * @enum {string}
             */
            format: "json" | "jsonl" | "csv" | "xls" | "xlsx";
            /**
             * @description The spec defines the columns to export. This is applicable for csv, xls and xslx formats.
             *
             *     Export spec specifies how to export the entity JSON to a csv. A simple export spec looks like `name;summary`. To specify more complex export spec, including specifying how many of a list of `industries` to return, or the ideal `employment` record, see [Exporting Columnar Format](https://docs.diffbot.com/reference/exporting-csv) and [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields).
             */
            exportspec?: string;
            /** @description For export endpoint, define separator for fields which contains multiple values */
            exportseparator?: string;
            /** @description For export endpoint, The file name of the export file */
            exportfile?: string;
            /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
            filter?: string;
            /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
            filterExclude?: string;
            /**
             * @description `extended` returns origin information for facts. `id` returns just the diffbotIds and origins.
             * @enum {string}
             */
            jsonmode?: "extended" | "id";
            /**
             * @description `nonCanonicalFacts=true` returns non-canonical facts.
             * @default false
             */
            nonCanonicalFacts: boolean;
            /**
             * @description `noDedupArticles=true` indicates that articles should not be deduplicated but all of them returned
             * @default false
             */
            noDedupArticles: boolean;
            /**
             * @description Articles only. Utilize Diffbot clustering algorithms to identify related or similar objects.
             *     - `cluster=all` to return each article with a clusterId identifying thematically-similar articles.
             *     - `cluster=best` to remove thematically-similar articles from the result set, leaving a single best representative from each cluster.
             *     - `cluster=dedupe` to remove exact and near-duplicate articles from the result set. Where applicable, clusterId is returned in the `entity_ctx` element of each response entity.
             * @enum {string}
             */
            cluster?: never;
            /**
             * @description Generate coverage report. See [Coverage Reports](https://docs.diffbot.com/docs/dql-coverage-reports) for more details on generating coverage reports for DQL queries.
             * @default false
             */
            report: boolean;
            view?: string;
        };
        /** @description Returned when the DQL query itself cannot be parsed. */
        QueryParseError: {
            /** @example true */
            error?: boolean;
            /** @example Encountered " ":" ": "" at line 1, column 6. */
            message?: string;
            /** @example 1 */
            line?: number;
            /** @example 6 */
            column?: number;
            /**
             * @description The message with the offending token wrapped in `<mark>` for display.
             * @example <span>type:<mark>:</mark>:Bogus((</span>
             */
            htmlMessage?: string;
        };
        /** @description Returned when a request parameter is missing or invalid. */
        ParameterError: {
            /** @example true */
            error?: boolean;
            /** @example Parameter 'query' not specified */
            message?: string;
        };
        AuthError: {
            /** @example 401 */
            code?: number;
            /** @example Unauthorized. Incorrect token. */
            message?: string;
            /** @example a9cbf96bb0e2084d5c1595ae8f526576 */
            requestId?: string;
        };
        ServerError: {
            /** @example 500 */
            code?: number;
            /** @example HTTP 500 Internal Server Error */
            message?: string;
        };
    };
    responses: {
        /** @description Query results */
        Results: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["DqlResponse"];
                "application/json-lines": Record<string, never>;
                "text/csv": Record<string, never>;
                "application/ms-excel": Record<string, never>;
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": Record<string, never>;
            };
        };
        /** @description Error parsing the query */
        QueryParseError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["QueryParseError"];
            };
        };
        /** @description Unauthorized */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["AuthError"];
            };
        };
        /** @description Invalid or missing parameters */
        ParameterError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ParameterError"];
            };
        };
        /** @description Internal Server Error */
        ServerError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ServerError"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    dqlGet: {
        parameters: {
            query: {
                /** @description Query type */
                type?: "query" | "crawl";
                /** @description DQL Query */
                query: string;
                /** @description Comma-delimited list of custom crawl collections to query. Specify `all` to query all collections for your token. This parameter is valid only when type=crawl and defaults to `all` */
                col?: string;
                /**
                 * @description Return results starting at `from` index. `from+size <= 10_000` for facet queries.
                 *
                 *     Please note that the from parameter is no longer applicable to Article queries and has been deprecated. In the future, using this parameter will result in an error.
                 */
                from?: number;
                /** @description Maximum number of results to return. `-1` to return all results. `from+size <= 10_000` for facet queries. */
                size?: number;
                /** @description Output format */
                format?: "json" | "jsonl" | "csv" | "xls" | "xlsx";
                /**
                 * @description The spec defines the columns to export. This is applicable for csv, xls and xslx formats.
                 *
                 *     Export spec specifies how to export the entity JSON to a csv. A simple export spec looks like `name;summary`. To specify more complex export spec, including specifying how many of a list of `industries` to return, or the ideal `employment` record, see [Exporting Columnar Format](https://docs.diffbot.com/reference/exporting-csv) and [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields).
                 */
                exportspec?: string;
                /** @description The export separator */
                exportseparator?: string;
                /** @description For export endpoint, The file name of the export file */
                exportfile?: string;
                /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filter?: string;
                /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filterExclude?: string;
                /** @description `extended` returns origin information for facts. `id` returns just the diffbotIds and origins. */
                jsonmode?: "extended" | "id";
                /** @description `nonCanonicalFacts=true` returns non-canonical facts. */
                nonCanonicalFacts?: boolean;
                /** @description `noDedupArticles=true` indicates that articles should not be deduplicated but all of them returned */
                noDedupArticles?: boolean;
                /**
                 * @description Articles only. Utilize Diffbot clustering algorithms to identify related or similar objects.
                 *     - `cluster=all` to return each article with a clusterId identifying thematically-similar articles.
                 *     - `cluster=best` to remove thematically-similar articles from the result set, leaving a single best representative from each cluster.
                 *     - `cluster=dedupe` to remove exact and near-duplicate articles from the result set. Where applicable, clusterId is returned in the `entity_ctx` element of each response entity.
                 */
                cluster?: "all" | "best" | "dedupe";
                /** @description Generate coverage report. See [Coverage Reports](https://docs.diffbot.com/docs/dql-coverage-reports) for more details on generating coverage reports for DQL queries. */
                report?: boolean;
                view?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Results"];
            400: components["responses"]["QueryParseError"];
            401: components["responses"]["Unauthorized"];
            422: components["responses"]["ParameterError"];
            500: components["responses"]["ServerError"];
        };
    };
    dqlPost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description DQL request */
        requestBody?: {
            content: {
                "application/json": components["schemas"]["DqlPostRequest"];
            };
        };
        responses: {
            200: components["responses"]["Results"];
            400: components["responses"]["QueryParseError"];
            401: components["responses"]["Unauthorized"];
            422: components["responses"]["ParameterError"];
            500: components["responses"]["ServerError"];
        };
    };
    reportFind: {
        parameters: {
            query: {
                /** @description DQL Query */
                query: string;
                /**
                 * @description Return results starting at `from` index. `from+size <= 10_000` for facet queries.
                 *
                 *     Please note that the from parameter is no longer applicable to Article queries and has been deprecated. In the future, using this parameter will result in an error.
                 */
                from?: number;
                /** @description Maximum number of results to return. `-1` to return all results. `from+size <= 10_000` for facet queries. */
                size?: number;
                /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filter?: string;
                /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filterExclude?: string;
                /**
                 * @description The spec defines the columns to export. This is applicable for csv, xls and xslx formats.
                 *
                 *     Export spec specifies how to export the entity JSON to a csv. A simple export spec looks like `name;summary`. To specify more complex export spec, including specifying how many of a list of `industries` to return, or the ideal `employment` record, see [Exporting Columnar Format](https://docs.diffbot.com/reference/exporting-csv) and [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields).
                 */
                exportspec?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Coverage report */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example DiffbotID,Name,$.name,$.nbEmployees
                     *     "",,1.0,1.0
                     *     El0wZJw_cOn-MAyp_hZZ5Tw,Yandex,1,1
                     *     EUFq-3WlpNsq0pvfUYWXOEA,Google,1,1
                     *     Ec5P22-6EPLOXo1-z6-4NzA,Instagram,1,1
                     */
                    "text/csv": string;
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    reportGet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The report id */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Coverage report */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example DiffbotID,Name,$.name,$.nbEmployees
                     *     "",,1.0,1.0
                     *     El0wZJw_cOn-MAyp_hZZ5Tw,Yandex,1,1
                     *     EUFq-3WlpNsq0pvfUYWXOEA,Google,1,1
                     *     Ec5P22-6EPLOXo1-z6-4NzA,Instagram,1,1
                     */
                    "text/csv": string;
                };
            };
            /** @description Report not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ParameterError"];
                };
            };
            500: components["responses"]["ServerError"];
        };
    };
}
