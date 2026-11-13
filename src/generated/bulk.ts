/**
 * Generated from openapi/bulk.json by `pnpm gen:types`. Do not hand-edit.
 * Source: openapi-typescript v7.13.0
 */
export interface paths {
    "/bulk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Manage a Bulk Extract Job
         * @description Pause, delete, restart, or view the status of a bulk job.
         */
        get: operations["pause-delete-or-restart-a-bulk-job"];
        put?: never;
        /**
         * Create a Bulk Extract Job
         * @description Extract a list of URLs asynchronously
         */
        post: operations["create-a-bulk-job"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bulk/data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Retrieve Bulk Extract Job Data
         * @description Download the extracted results of a bulk job
         */
        get: operations["retrieve-bulk-job-data"];
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
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "pause-delete-or-restart-a-bulk-job": {
        parameters: {
            query?: {
                /** @description Job name as defined when the bulk job was created. */
                name?: string;
                /** @description Pass `pause=1` to pause a bulk job. Pass `pause=0` to resume a paused job. */
                pause?: string;
                /** @description Pass `restart=1` to restart a bulk job. This will erase all processed data and re-process all of the submitted URLs. */
                restart?: string;
                /** @description Pass `delete=1 `to delete a job, and all associated data, completely. */
                delete?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Job managed */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example Successfully added urls for spidering. */
                        response?: string;
                        jobs?: {
                            jobStatus?: {
                                /** @example Job is initializing. */
                                message?: string;
                                /** @example 0 */
                                status?: number;
                            };
                            /** @example -1 */
                            maxHops?: number;
                            /** @example ...json */
                            downloadJson?: string;
                            /** @example  */
                            urlProcessPattern?: string;
                            /** @example 0 */
                            jobCompletionTimeUTC?: number;
                            /** @example -1 */
                            maxRounds?: number;
                            /** @example bulk */
                            type?: string;
                            /** @example 0 */
                            pageCrawlSuccessesThisRound?: number;
                            /** @example  */
                            urlCrawlRegEx?: string;
                            /** @example  */
                            pageProcessPattern?: string;
                            /** @example https://api.diffbot.com/v3/analyze */
                            apiUrl?: string;
                            /** @example 1 */
                            useCanonical?: number;
                            /** @example 1649950325 */
                            jobCreationTimeUTC?: number;
                            /** @example 0 */
                            repeat?: number;
                            /** @example ...csv */
                            downloadUrls?: string;
                            /** @example 1 */
                            obeyRobots?: number;
                            /** @example 0 */
                            roundsCompleted?: number;
                            /** @example 0 */
                            pageCrawlAttempts?: number;
                            /** @example  */
                            notifyWebhook?: string;
                            /** @example 0 */
                            pageProcessSuccessesThisRound?: number;
                            customHeaders?: Record<string, never>;
                            /** @example 0 */
                            objectsFound?: number;
                            /** @example 0 */
                            roundStartTime?: number;
                            /** @example  */
                            urlCrawlPattern?: string;
                            /** @example -1 */
                            seedRecrawlFrequency?: number;
                            /** @example  */
                            urlProcessRegEx?: string;
                            /** @example 0 */
                            pageProcessSuccesses?: number;
                            /** @example 0 */
                            urlsHarvested?: number;
                            /** @example -1 */
                            crawlDelay?: number;
                            /** @example 1649950325 */
                            currentTime?: number;
                            /** @example 0 */
                            useProxies?: number;
                            /** @example 0 */
                            sentJobDoneNotification?: number;
                            /** @example 1649950325 */
                            currentTimeUTC?: number;
                            /** @example bulkTest */
                            name?: string;
                            /** @example  */
                            notifyEmail?: string;
                            /** @example 0 */
                            pageCrawlSuccesses?: number;
                            /** @example 0 */
                            pageProcessAttempts?: number;
                        }[];
                    };
                };
            };
            /** @description No job found by that name */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 500 */
                        errorCode?: string;
                        /** @example no collection record. */
                        error?: string;
                    };
                };
            };
        };
    };
    "create-a-bulk-job": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/x-www-form-urlencoded": {
                    /** @description Job name. This should be a unique identifier and will be used to modify your bulk job and retrieve its output. */
                    name: string;
                    /** @description Space-delimited list of URLs to process. If you are on the Startup plan, jobs must contain at least 50 URLs. */
                    urls: string;
                    /** @description The full Extract (or Custom) API to be used for each URL. For instance, to process each URL via the Article API, supply `https://api.diffbot.com/v3/article`. You may also include API parameters, e.g. `https://api.diffbot.com/v3/article?fields=meta,tags`. */
                    apiUrl: string;
                    /** @description Set custom headers to be used for processing each URL. Send multiple `customHeaders` values in your POST body, with header keys/values delimited by a colon (and URL-encoded). */
                    customHeaders?: string;
                    /** @description Send a message to this email address when the bulk job completes. */
                    notifyEmail?: string;
                    /** @description Pass a URL to be notified when the bulk job completes. You will receive a POST with a JSON response. */
                    notifyWebhook?: string;
                    /** @description Pass `obeyRobots=0` to ignore a site's robots.txt instructions. */
                    obeyRobots?: string;
                    /**
                     * Format: float
                     * @description Specify the number of days as a floating-point (e.g. `repeat=7.0`) to repeat this job. By default bulk jobs will not be repeated.
                     */
                    repeat?: number;
                    /** @description Enter ||-separated strings to limit pages processed to those whose HTML contains any of the content strings. If a page does not contain at least one of the strings, it will be ignored. */
                    pageProcessPattern?: string;
                };
            };
        };
        responses: {
            /** @description Bulk job created */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example Successfully added urls for spidering. */
                        response?: string;
                        jobs?: {
                            jobStatus?: {
                                /** @example Job is initializing. */
                                message?: string;
                                /** @example 0 */
                                status?: number;
                            };
                            /** @example -1 */
                            maxHops?: number;
                            /** @example ...json */
                            downloadJson?: string;
                            /** @example  */
                            urlProcessPattern?: string;
                            /** @example 0 */
                            jobCompletionTimeUTC?: number;
                            /** @example -1 */
                            maxRounds?: number;
                            /** @example bulk */
                            type?: string;
                            /** @example 0 */
                            pageCrawlSuccessesThisRound?: number;
                            /** @example  */
                            urlCrawlRegEx?: string;
                            /** @example  */
                            pageProcessPattern?: string;
                            /** @example https://api.diffbot.com/v3/analyze */
                            apiUrl?: string;
                            /** @example 1 */
                            useCanonical?: number;
                            /** @example 1649950325 */
                            jobCreationTimeUTC?: number;
                            /** @example 0 */
                            repeat?: number;
                            /** @example ...csv */
                            downloadUrls?: string;
                            /** @example 1 */
                            obeyRobots?: number;
                            /** @example 0 */
                            roundsCompleted?: number;
                            /** @example 0 */
                            pageCrawlAttempts?: number;
                            /** @example  */
                            notifyWebhook?: string;
                            /** @example 0 */
                            pageProcessSuccessesThisRound?: number;
                            customHeaders?: Record<string, never>;
                            /** @example 0 */
                            objectsFound?: number;
                            /** @example 0 */
                            roundStartTime?: number;
                            /** @example  */
                            urlCrawlPattern?: string;
                            /** @example -1 */
                            seedRecrawlFrequency?: number;
                            /** @example  */
                            urlProcessRegEx?: string;
                            /** @example 0 */
                            pageProcessSuccesses?: number;
                            /** @example 0 */
                            urlsHarvested?: number;
                            /** @example -1 */
                            crawlDelay?: number;
                            /** @example 1649950325 */
                            currentTime?: number;
                            /** @example 0 */
                            useProxies?: number;
                            /** @example 0 */
                            sentJobDoneNotification?: number;
                            /** @example 1649950325 */
                            currentTimeUTC?: number;
                            /** @example bulkTest */
                            name?: string;
                            /** @example  */
                            notifyEmail?: string;
                            /** @example 0 */
                            pageCrawlSuccesses?: number;
                            /** @example 0 */
                            pageProcessAttempts?: number;
                        }[];
                    };
                };
            };
            /** @description Token missing or invalid */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 401 */
                        errorCode?: number;
                        /** @example Not authorized API token. */
                        error?: string;
                    };
                };
            };
            /** @description No URLs were found in the request */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 500 */
                        errorCode?: string;
                        /** @example no urls found */
                        error?: string;
                    };
                };
            };
            /** @description Job name rejected — names can consist only of letters, numbers, underscores, or hyphens */
            505: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 505 */
                        errorCode?: number;
                        /** @example Crawl names can consist only of letters, numbers, underscores or hyphens. */
                        error?: string;
                    };
                };
            };
        };
    };
    "retrieve-bulk-job-data": {
        parameters: {
            query: {
                /** @description Name of the bulk job whose data you wish to download. */
                name: string;
                /** @description Request `format=csv` to download the extracted data in CSV format (default: `json`). Note that CSV files will only contain top-level fields. */
                format?: string;
                /** @description Request `type=urls` to retrieve the [URL Report (CSV)](/docs/crawl/faq/url-report). */
                type?: string;
                /** @description Pass an integer value (e.g. `num=100`) to request a subset of URLs, most recently processed first. */
                num?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The bulk job's extracted data */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": ({
                        /**
                         * @description Name of the Crawl or Bulk job this record was extracted from
                         * @example docs-bulkdata-sample
                         */
                        col: string;
                        /**
                         * @description Immediate parent contained a link to this record
                         * @example https://example.com
                         */
                        parentUrl: string;
                        /**
                         * @description The URL of this record
                         * @example https://example.com/
                         */
                        pageUrl: string;
                        /**
                         * @description A reference
                         * @example 6526070754824580000
                         */
                        id: number;
                        /**
                         * @description A standard entity type assigned either on job creation or classified by [Analyze API](/docs/extract/analyze). All other keys on this job record follow the [ontology](/docs/ontology/) set by its type.
                         * @example other
                         */
                        type: string;
                        /**
                         * @description Your token
                         * @example <REDACTED>
                         */
                        token: string;
                        /**
                         * @description Time when record was crawled, in ISO 8601 format.
                         * @example 2026-07-24T23:03:01Z
                         */
                        timestamp: string;
                    } & {
                        [key: string]: unknown;
                    })[];
                };
            };
            /** @description No job found by that name */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 400 */
                        errorCode?: number;
                        /** @example No collection record */
                        error?: string;
                    };
                };
            };
        };
    };
}
