/**
 * Generated from openapi/enhance.json by `pnpm gen:types`. Do not hand-edit.
 * Source: openapi-typescript v7.13.0
 */
export interface paths {
    "/kg/v3/enhance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Enhance
         * @description Enrich a person or organization record with partial data input
         */
        get: operations["enhance"];
        put?: never;
        /**
         * Enhance
         * @description Enrich a person or organization record with partial data input (POST option)
         */
        post: operations["enhancePost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/combine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Combine
         * @description Enrich a person record and return both person and current employer data
         */
        get: operations["combine"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a Bulkjob
         * @description Enhance multiple records in bulk asynchronously
         */
        post: operations["submitBulkjob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Bulkjobs for Token
         * @description Poll the status of all Enhance Bulkjobs for a token
         */
        get: operations["bulkjobStatusForToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk/{bulkjobId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Poll bulkjob status
         * @description Poll the status of an Enhance Bulkjob
         */
        get: operations["bulkjobStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk/{bulkjobId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download Results of Bulkjob
         * @description Download the result of a completed Enhance Bulkjob
         */
        get: operations["bulkjobResultGet"];
        put?: never;
        /**
         * Download Results of Bulkjob
         * @description Download the result of a completed Enhance Bulkjob
         */
        post: operations["bulkjobResultPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk/report/{bulkjobId}/{reportId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download Bulkjob Coverage Report
         * @description Download the coverage report of a completed Bulk Enhance job
         */
        get: operations["coverageReportGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk/{bulkjobId}/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Delete Bulkjob
         * @description Delete bulkjob
         */
        get: operations["deleteBulkjob"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk/{bulkjobId}/{jobIdx}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download Single Result of Bulkjob
         * @description Use this API to download the result of a single job within a bulkjob by specifying the index of the job.
         */
        get: operations["singleResult"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/kg/v3/enhance/bulk/{bulkjobId}/stop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Stop Bulkjob
         * @description Stop an active Enhance Bulkjob
         */
        get: operations["stopBulkjob"];
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
        /** @description Enhanced entity data */
        Data: {
            /**
             * Format: double
             * @description Enhance score
             */
            score?: number;
            /** Format: double */
            esscore?: number;
            entity?: components["schemas"]["ObjectNode"];
            errors?: string[];
            /** @description Refresh info for debug */
            refreshInfo?: {
                [key: string]: components["schemas"]["RefreshDebugInformation"];
            };
            refreshDelta?: components["schemas"]["Delta"];
            /** @description Entity-level context */
            entity_ctx?: {
                [key: string]: Record<string, never>;
            };
        };
        Delta: Record<string, never>;
        EnhanceResponse: {
            /**
             * Format: int32
             * @description Response version
             */
            version?: number;
            /**
             * Format: int32
             * @description Number of matches returned
             */
            hits?: number;
            /** @description Version of KG that was queried */
            kgversion?: string;
            request_ctx?: components["schemas"]["RequestContext"];
            data?: components["schemas"]["Data"][];
            errors?: string[];
            /** @description Search info for debug */
            searchInfo?: {
                [key: string]: components["schemas"]["SearchCandidate"];
            };
        };
        /**
         * @description Enhanced entity. Can be null if no entity was found.
         * @example {
         *       "id": "EYX1i02YVPsuT7fPLUYgRhQ",
         *       "images": [
         *         {
         *           "naturalHeight": 0,
         *           "width": 0,
         *           "url": "https://kg.diffbot.com/image/api/get?fetch=yes&url=g%3Cj7P0St%7D9u.LnOv%7BI%7C%40g7.pBYINs%3Ff%7CGZ7jr-tGZhWf%3DK%2FOvy%5Bp%3CSKbs8i%7CEyNzCa%3EYr%3Ef%3CRc%3CLr5gx_hOgiFuER5%3Cb%7C%3E.I%5Do",
         *           "isCached": true,
         *           "naturalWidth": 0,
         *           "primary": true,
         *           "height": 0
         *         }
         *       ],
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
        ObjectNode: Record<string, never>;
        OrganizationRequest: {
            /** @description Diffbot entity type */
            type?: string;
            /** @description Name of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            name?: string[];
            /** @description Origin or homepage URI of entity to enhance. Parameter can be used with types `Person` and `Organization` */
            url?: string[];
            /** @description Location of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            location?: string;
            /** @description IP address of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            ip?: string;
            /** @description Phone of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            phone?: string;
            /** @description Description of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            description?: string;
        };
        PersonRequest: {
            /** @description Diffbot entity type */
            type?: string;
            /** @description Name of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            name?: string[];
            /** @description Origin or homepage URI of entity to enhance. Parameter can be used with types `Person` and `Organization` */
            url?: string[];
            /** @description Location of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            location?: string;
            /** @description IP address of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            ip?: string;
            /** @description Phone of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            phone?: string;
            /** @description Description of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            description?: string;
            /** @description Email of the entity to enhance. Parameter can be used only with type `Person` */
            email?: string[];
            /** @description Employer of the entity to enhance. Parameter can be used only with type `Person` */
            employer?: string;
            /** @description Title of the entity to enhance. Parameter can be used only with type `Person` */
            title?: string;
            /** @description School of the entity to enhance. Parameter can be used only with type `Person` */
            school?: string;
        };
        RefreshDebugInformation: {
            url?: string;
            hasResult?: boolean;
            /** Format: int64 */
            lastCrawlTime?: number;
            message?: string;
        };
        /** @description Request context */
        RequestContext: {
            /** @description Submitted query */
            query?: components["schemas"]["OrganizationRequest"] | components["schemas"]["PersonRequest"] | string;
            /** @description Query context. Example: submitted query parameters etc. */
            query_ctx?: {
                [key: string]: Record<string, never>;
            };
        };
        /** @description Search info for debug */
        SearchCandidate: {
            /** Format: double */
            mlScore?: number;
            /** Format: double */
            baseMlScore?: number;
            debugInfo?: components["schemas"]["RefreshDebugInformation"];
        };
        /** @description Bulkjob status */
        BulkjobStatus: {
            /** @description Bulkjob Id */
            job_id?: string;
            /** @description Bulkjob name */
            name?: string;
            /** @description Is Refresh enabled for this job? */
            refresh?: boolean;
            /**
             * @description Is Search enabled for this job?
             * @enum {string}
             */
            search?: "ON" | "OFF" | "SEARCHONLY" | "FALLBACK";
            /** @description Bulkjob status message */
            message?: string;
            /**
             * Format: int32
             * @description Number of jobs in bulkjob
             */
            jobs_total?: number;
            /**
             * Format: int32
             * @description Number of jobs completed in bulkjob.
             */
            jobs_completed?: number;
            /**
             * @description Status of Bulkjob. One of {NOT_STARTED, IN_PROCESS, COMPLETE, COMPLETE_WITH_FAILURES, STOPPED, ERROR_FINALIZING, UNKNOWN}
             * @enum {string}
             */
            status?: "NOT_STARTED" | "IN_PROCESS" | "COMPLETE" | "COMPLETE_WITH_FAILURES" | "STOPPED" | "ERROR_FINALIZING" | "ERROR_SCHEDULING" | "UNKNOWN";
            /**
             * Format: int64
             * @description Estimated remaining time for bulkjob to complete (in seconds). `null` if job is completed or not started.
             */
            estimate_remaining_time?: number;
            /**
             * Format: int64
             * @description Bulkjob submit time
             */
            submit_time_ms?: number;
            /**
             * Format: int64
             * @description Bulkjob start time
             */
            start_time_ms?: number;
            /**
             * Format: int64
             * @description Bulkjob completed time
             */
            completed_time_ms?: number;
            /**
             * Format: int32
             * @description Total results
             */
            total_results?: number;
            bulkjobId?: string;
            /** Format: int32 */
            totalJobs?: number;
            /** Format: int32 */
            finishedJobs?: number;
            /** Format: int64 */
            estimateRemainingTimeSec?: number;
            /** Format: int64 */
            submitTimeMs?: number;
            /** Format: int64 */
            startTimeMs?: number;
            /** Format: int64 */
            completedTimeMs?: number;
            /** Format: int32 */
            totalResults?: number;
            /**
             * Format: int64
             * @description Size of download file in bytes
             */
            fileSizeBytes?: number;
            /** @description Coverage reports generated for this bulkjob */
            reports?: components["schemas"]["Report"][];
        };
        /** @description Coverage reports generated for this bulkjob */
        Report: {
            /** @description Coverage Report ID */
            reportId?: string;
            /**
             * @description Status of report generation. One of {NOT_STARTED, IN_PROCESS, COMPLETE, UNKNOWN}
             * @enum {string}
             */
            status?: "NOT_STARTED" | "IN_PROCESS" | "COMPLETE" | "COMPLETE_WITH_FAILURES" | "STOPPED" | "ERROR_FINALIZING" | "ERROR_SCHEDULING" | "UNKNOWN";
            /** @description Export format */
            format?: string;
            /**
             * @description The spec defines the columns to export. This is applicable for csv, xls and xslx formats.
             *
             *     Export spec specifies how to export the entity JSON to a csv. A simple export spec looks like `name;summary`. To specify more complex export spec, including specifying how many of a list of `industries` to return, or the ideal `employment` record, see [Exporting Columnar Format](https://docs.diffbot.com/reference/exporting-csv) and [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields).
             */
            spec?: string;
            exportfile?: string;
            /** @description Separator for multi-value fields when exporting columnar results */
            exportSeparator?: string;
            /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
            filter?: string;
            /** @description Return only records that have a match */
            onlyMatches?: boolean;
        };
        StatusResponseError: {
            /**
             * Format: int32
             * @description Status code (same as the HTTP status code)
             */
            code?: number;
            /** @description Status message */
            message?: string;
            request_ctx?: components["schemas"]["RequestContext"];
            bulkjobStatus?: components["schemas"]["BulkjobStatus"];
            /** @description `true` if error */
            error?: boolean;
        };
        AuthError: {
            /** @description Identifier of the rejected request, also returned in the `X-Diffbot-RequestId` header */
            requestId?: string;
            /**
             * Format: int32
             * @description Status code (same as the HTTP status code)
             */
            code?: number;
            /** @description Status message */
            message?: string;
        };
        JsonNode: Record<string, never>;
        BulkjobResultPostRequest: {
            /**
             * Format: int32
             * @description Return first n results
             */
            head?: number;
            /**
             * Format: int32
             * @description 1-based index of the first result to return (1 = first result).
             */
            from?: number;
            /**
             * Format: int32
             * @description Maximum number of results to return starting from the 'from' position.
             */
            size?: number;
            /** @description Return only records that have a match */
            onlyMatches?: boolean;
            /**
             * @description Export format
             * @enum {string}
             */
            format?: "json" | "jsonl" | "csv" | "xls" | "xlsx";
            /**
             * @description The spec defines the columns to export. This is applicable for csv, xls and xslx formats.
             *
             *     Export spec specifies how to export the entity JSON to a csv. A simple export spec looks like `name;summary`. To specify more complex export spec, including specifying how many of a list of `industries` to return, or the ideal `employment` record, see [Exporting Columnar Format](https://docs.diffbot.com/reference/exporting-csv) and [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields).
             */
            exportspec?: string;
            /** @description File name of the export file */
            exportfile?: string;
            /** @description Separator for multi-value fields when exporting columnar results */
            exportseparator?: string;
            /** @description Prefixes the enhance query parameters to the CSV export result */
            exportquery?: boolean;
            /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
            filter?: string;
            /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
            filterExclude?: string;
            /**
             * Format: int32
             * @description Seconds to wait for bulkjob results to export. Results will continue to export in the background. To only trigger an export, use 0.
             */
            wait?: number;
        };
        BulkjobStatusResponse: {
            /**
             * Format: int32
             * @description Bulkjob status code (same as the HTTP status code)
             */
            code?: number;
            content?: components["schemas"]["BulkjobStatus"];
        };
        BulkjobRecoveryStatusResponse: {
            /**
             * @description Bulkjob recovery status
             * @enum {string}
             */
            status?: "NOT_STARTED" | "IN_PROCESS" | "COMPLETE" | "COMPLETE_WITH_FAILURES" | "STOPPED" | "ERROR_FINALIZING" | "ERROR_SCHEDULING" | "UNKNOWN";
            /** @description Bulkjob recovery status message */
            message?: string;
        };
        BulkjobAccepted: {
            /** @description Bulkjob Id for checking status and downloading results */
            job_id?: string;
        };
        IdRequestEntity: {
            /** @description DiffbotId of entity to enhance. Parameter can be used with types `Person` and `Organization` */
            id?: string;
        };
        EnhancePostRequest: {
            /**
             * @description Diffbot entity type
             * @enum {string}
             */
            type: "Person" | "Organization";
            /** @description DiffbotId of entity to enhance. Parameter can be used with types `Person` and `Organization` */
            id?: string;
            /** @description Name of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            name?: string[];
            /** @description Origin or homepage URI of entity to enhance. Parameter can be used with types `Person` and `Organization` */
            url?: string[];
            /** @description Location of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            location?: string;
            /** @description IP address of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            ip?: string;
            /** @description Phone of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            phone?: string;
            /** @description Description of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
            description?: string;
            /** @description Email of the entity to enhance. Parameter can be used only with type `Person` */
            email?: string[];
            /** @description Employer of the entity to enhance. Parameter can be used only with type `Person` */
            employer?: string;
            /** @description Title of the entity to enhance. Parameter can be used only with type `Person` */
            title?: string;
            /** @description School of the entity to enhance. Parameter can be used only with type `Person` */
            school?: string;
            /** @description User defined ID for correlation */
            customId?: string;
            /**
             * Format: int32
             * @description Maximum number of results to return
             * @default 1
             */
            size: number;
            /**
             * Format: double
             * @description Enhance similarity threshold
             */
            threshold?: number;
            /**
             * @description `refresh=true` indicates that Diffbot will attempt to recrawl all the origins of the identified entity and reconstruct the returned entity from this refreshed data.
             * @default false
             */
            refresh: boolean;
            /**
             * @description `search=true` indicates that Diffbot will attempt to search the web for origins for the search query and merge relevant results with whats found in the KG.
             * @default false
             */
            search: boolean;
            /**
             * @description `nonCanonicalFacts=true` returns non-canonical facts.
             * @default false
             */
            nonCanonicalFacts: boolean;
            /**
             * @description `jsonmode=extended` returns origin information for facts.
             * @enum {string}
             */
            jsonmode?: "extended";
            /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
            filter?: string;
            /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
            filterExclude?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    enhance: {
        parameters: {
            query: {
                /** @description Diffbot entity type */
                type: "Person" | "Organization";
                /** @description DiffbotId of entity to enhance. Parameter can be used with types `Person` and `Organization` */
                id?: string;
                /** @description Name of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                name?: string[];
                /** @description Origin or homepage URI of entity to enhance. Parameter can be used with types `Person` and `Organization` */
                url?: string[];
                /** @description Phone of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                phone?: string;
                /** @description Email of the entity to enhance. Parameter can be used only with type `Person` */
                email?: string[];
                /** @description Employer of the entity to enhance. Parameter can be used only with type `Person` */
                employer?: string;
                /** @description Title of the entity to enhance. Parameter can be used only with type `Person` */
                title?: string;
                /** @description School of the entity to enhance. Parameter can be used only with type `Person` */
                school?: string;
                /** @description Location of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                location?: string;
                /** @description Description of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                description?: string;
                /** @description IP address of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                ip?: string;
                /** @description User defined ID for correlation */
                customId?: string;
                /** @description Maximum number of results to return */
                size?: number;
                /** @description Enhance similarity threshold */
                threshold?: number;
                /** @description `refresh=true` indicates that Diffbot will attempt to recrawl all the origins of the identified entity and reconstruct the returned entity from this refreshed data. */
                refresh?: boolean;
                /** @description `search=true` indicates that Diffbot will attempt to search the web for origins for the search query and merge relevant results with whats found in the KG. */
                search?: boolean;
                /** @description `nonCanonicalFacts=true` returns non-canonical facts. */
                nonCanonicalFacts?: boolean;
                /** @description `jsonmode=extended` returns origin information for facts. */
                jsonmode?: "extended";
                /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filter?: string;
                /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filterExclude?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Enhanced entity */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnhanceResponse"];
                };
            };
            /** @description Error parsing request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Insufficient credits */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    enhancePost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EnhancePostRequest"];
            };
        };
        responses: {
            /** @description Enhanced entity */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnhanceResponse"];
                };
            };
            /** @description Error parsing request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Insufficient credits */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    combine: {
        parameters: {
            query: {
                /** @description Diffbot entity type */
                type: "Person";
                /** @description Name of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                name?: string[];
                /** @description Origin or homepage URI of entity to enhance. Parameter can be used with types `Person` and `Organization` */
                url?: string[];
                /** @description Phone of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                phone?: string;
                /** @description Email of the entity to enhance. Parameter can be used only with type `Person` */
                email?: string;
                /** @description Employer of the entity to enhance. Parameter can be used only with type `Person` */
                employer?: string;
                /** @description Title of the entity to enhance. Parameter can be used only with type `Person` */
                title?: string;
                /** @description School of the entity to enhance. Parameter can be used only with type `Person` */
                school?: string;
                /** @description Location of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                location?: string;
                /** @description IP address of the entity to enhance. Parameter can be used with types `Person` and `Organization` */
                ip?: string;
                /** @description User defined ID for correlation */
                customId?: string;
                /** @description Enhance similarity threshold */
                threshold?: number;
                /** @description `refresh=true` indicates that Diffbot will attempt to recrawl all the origins of the identified entity and reconstruct the returned entity from this refreshed data. */
                refresh?: boolean;
                /** @description `search=true` indicates that Diffbot will attempt to search the web for origins for the search query and merge relevant results with whats found in the KG. */
                search?: boolean;
                /** @description `nonCanonicalFacts=true` returns non-canonical facts. */
                nonCanonicalFacts?: boolean;
                /** @description `jsonmode=extended` returns origin information for facts. */
                jsonmode?: "extended";
                /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filter?: string;
                /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filterExclude?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Enhanced entity */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnhanceResponse"];
                };
            };
            /** @description Error parsing request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Insufficient credits */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    submitBulkjob: {
        parameters: {
            query?: {
                /** @description Enhance Bulkjob name */
                name?: string;
                /** @description Maximum number of results to return */
                size?: number;
                /** @description Enhance similarity threshold */
                threshold?: number;
                /** @description `refresh=true` indicates that Diffbot will attempt to recrawl all the origins of the identified entity and reconstruct the returned entity from this refreshed data. */
                refresh?: boolean;
                /** @description `search=true` indicates that Diffbot will attempt to search the web for origins for the search query and merge relevant results with whats found in the KG. */
                search?: boolean;
                /** @description `nonCanonicalFacts=true` returns non-canonical facts. */
                nonCanonicalFacts?: boolean;
                /** @description `jsonmode=extended` returns origin information for facts. */
                jsonmode?: "extended";
                /** @description Webhook URL */
                webhookurl?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Bulk query payload */
        requestBody?: {
            content: {
                "application/json": (components["schemas"]["OrganizationRequest"] | components["schemas"]["PersonRequest"] | components["schemas"]["IdRequestEntity"])[];
            };
        };
        responses: {
            /** @description Acknowledgement with bulkjobId */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkjobAccepted"];
                };
            };
            /** @description Error parsing request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Insufficient credits */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    bulkjobStatusForToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success status */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkjobStatus"][];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    bulkjobStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Enhance Bulkjob ID */
                bulkjobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Bulkjob complete */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkjobStatusResponse"];
                };
            };
            /** @description Bulkjob is still executing or is stopped */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkjobStatusResponse"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Bulkjob not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    bulkjobResultGet: {
        parameters: {
            query?: {
                /** @description Return first n results */
                head?: number;
                /** @description 1-based index of the first result to return (1 = first result). */
                from?: number;
                /** @description Maximum number of results to return starting from the 'from' position. */
                size?: number;
                /** @description Return only records that have a match */
                onlyMatches?: "true" | "false";
                /** @description Export format */
                format?: "json" | "jsonl" | "csv" | "xls" | "xlsx";
                /**
                 * @description The spec defines the columns to export. This is applicable for csv, xls and xslx formats.
                 *
                 *     Export spec specifies how to export the entity JSON to a csv. A simple export spec looks like `name;summary`. To specify more complex export spec, including specifying how many of a list of `industries` to return, or the ideal `employment` record, see [Exporting Columnar Format](https://docs.diffbot.com/reference/exporting-csv) and [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields).
                 */
                exportspec?: string;
                /** @description File name of the export file */
                exportfile?: string;
                /** @description Separator for multi-value fields when exporting columnar results */
                exportseparator?: string;
                /** @description Prefixes the enhance query parameters to the CSV export result */
                exportquery?: "true" | "false";
                /** @description Semi-colon separated path filter to filter response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filter?: string;
                /** @description Semi-colon separated path filter to filter and exclude data from response json. You can use a simple dot notation `skills.name` or a JsonPath expression such as `$.name;$.locations.country.name`. For more advanced options, see [JsonPath Filtering](https://docs.diffbot.com/reference/filtering-fields) for syntax. */
                filterExclude?: string;
                /** @description Seconds to wait for bulkjob results to export. Results will continue to export in the background. To only trigger an export, use 0. */
                wait?: number;
            };
            header?: never;
            path: {
                /** @description Enhance Bulkjob ID */
                bulkjobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Result data. Depends on format (default is json lines). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JsonNode"];
                    "application/json-lines": Record<string, never>;
                    "text/csv": Record<string, never>;
                    "application/ms-excel": Record<string, never>;
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": Record<string, never>;
                };
            };
            /** @description Bulkjob or result export is still executing or is stopped */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Invalid bulkjobId */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Bulkjob not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    bulkjobResultPost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Enhance Bulkjob ID */
                bulkjobId: string;
            };
            cookie?: never;
        };
        /** @description Bulk results request */
        requestBody?: {
            content: {
                "application/json": components["schemas"]["BulkjobResultPostRequest"];
            };
        };
        responses: {
            /** @description Result data. Depends on format (default is json lines). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JsonNode"];
                    "application/json-lines": Record<string, never>;
                    "text/csv": Record<string, never>;
                    "application/ms-excel": Record<string, never>;
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": Record<string, never>;
                };
            };
            /** @description Bulkjob is still executing or is stopped */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Invalid bulkjobId */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Bulkjob not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    coverageReportGet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Enhance Bulkjob ID */
                bulkjobId: string;
                /** @description Enhance Report ID */
                reportId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Coverage report (csv) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": Record<string, never>;
                    "application/json": components["schemas"]["JsonNode"];
                };
            };
            /** @description Report generation still in progress */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Report not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    deleteBulkjob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Enhance Bulkjob ID */
                bulkjobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Bulkjob was successfully deleted */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid bulkjobId */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Bulkjob not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    singleResult: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Enhance Bulkjob ID */
                bulkjobId: string;
                /** @description Job index within the bulkjob */
                jobIdx: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Enhance result */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnhanceResponse"];
                };
            };
            /** @description Bulkjob is still executing or is stopped */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Invalid bulkjobId */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Bulkjob not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
    stopBulkjob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Enhance Bulkjob ID */
                bulkjobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Bulkjob status after the stop request */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkjobRecoveryStatusResponse"];
                };
            };
            /** @description Invalid bulkjobId */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Token not specified or other client errors */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthError"];
                };
            };
            /** @description Bulkjob not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResponseError"];
                };
            };
        };
    };
}
