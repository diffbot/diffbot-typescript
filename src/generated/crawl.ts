/**
 * Generated from openapi/crawl.json by `pnpm gen:types`. Do not hand-edit.
 * Source: openapi-typescript v7.13.0
 */
export interface paths {
    "/crawl": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Manage a Crawl Job
         * @description Pause, delete, restart, or view the status of a crawl job.
         */
        get: operations["manage-a-crawl-job"];
        put?: never;
        /**
         * Create a Crawl
         * @description Create and start a job to spider and extract pages through a site.
         */
        post: operations["create-a-crawl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crawl/data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Retrieve Crawl Job Data
         * @description Download the extracted results of a crawl job.
         */
        get: operations["retrieve-crawl-job-data"];
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
    "manage-a-crawl-job": {
        parameters: {
            query?: {
                /** @description Job name as defined when the crawl job was created. */
                name?: string;
                /** @description Pass `roundStart=1` to force the start of a new crawl "round" (manually repeat the crawl). If `onlyProcessIfNew` is set to 1 (default), only newly-created pages will be processed. */
                roundStart?: string;
                /** @description Pass `pause=1` to pause a crawl job. Pass `pause=0` to resume a paused job. */
                pause?: string;
                /** @description Pass `restart=1` to restart a crawl job. This will erase all processed data and re-process all of the submitted URLs. */
                restart?: string;
                /** @description Pass `delete=1`to delete a job, and all associated data, completely. */
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
                            /** @example crawl */
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
                            /** @example crawlTest */
                            name?: string;
                            /** @example  */
                            notifyEmail?: string;
                            /** @example 0 */
                            pageCrawlSuccesses?: number;
                            /** @example 0 */
                            pageProcessAttempts?: number;
                        }[];
                    } | {
                        /** @example Successfully added urls for spidering. */
                        response?: string;
                        jobs?: {
                            jobStatus?: {
                                /** @example Job paused. */
                                message?: string;
                                /** @example 6 */
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
                            /** @example crawl */
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
                            /** @example crawlTest */
                            name?: string;
                            /** @example  */
                            notifyEmail?: string;
                            /** @example 0 */
                            pageCrawlSuccesses?: number;
                            /** @example 0 */
                            pageProcessAttempts?: number;
                        }[];
                    } | {
                        /** @example Successfully deleted job. */
                        response?: string;
                    } | {
                        jobs?: {
                            jobStatus?: {
                                /** @example Job has completed and no repeat is scheduled. */
                                message?: string;
                                /** @example 9 */
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
                            /** @example crawl */
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
                            /** @example crawlTest */
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
            /** @description No crawl job by that name */
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
    "create-a-crawl": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/x-www-form-urlencoded": {
                    /** @description Job name. This should be a unique identifier and can be used to modify your crawl or retrieve its output. */
                    name: string;
                    /** @description Seed URL(s). Must be [URL encoded](https://en.wikipedia.org/wiki/Percent-encoding). Separate multiple URLs with whitespace to spider multiple sites within the same crawl. If the seed contains a non-www subdomain ("https://blog.diffbot.com" or "https://docs.diffbot.com") Crawl will restrict spidering to the specified **subdomain**. */
                    seeds: string;
                    /**
                     * @description Full Extract API URL through which to process pages. E.g., `&apiUrl=https://api.diffbot.com/v3/analyze` to process matching links via the Analyze API, which will automatically determine the page type to extract as. The Extract API URL can include querystring parameters to tailor the output.
                     *
                     *     For example, `&apiUrl=https://api.diffbot.com/v3/product?fields=querystring,meta` will process matching links using the Product API, and also return the querystring and meta fields.
                     */
                    apiUrl: string;
                    /** @description Set multiple custom headers to be used while crawling and processing pages sent to Diffbot APIs. Each header should be sent in its own `customHeaders` argument, with a colon delimiting the header name and value, and should be URL-encoded. For example, `&customHeaders=Accept-Language%3Aen-us`. [See more on using custom headers](/docs/extract/custom-headers). */
                    customHeaders?: string;
                    /**
                     * @description Pass `useCanonical=0` to disable deduplication of pages based on a canonical link definition. [See more](/products/crawl/faq/duplicate-content).
                     * @default 1
                     */
                    useCanonical?: number;
                    /**
                     * @description Pass `obeyRobots=0` to ignore a site's robots.txt instructions.
                     * @default 1
                     */
                    obeyRobots?: number;
                    /**
                     * @description Pass `restrictDomain=0` to allow limited crawling across subdomains/domains. [See more](/products/crawl/faq/restrict-to-domains).
                     * @default 1
                     */
                    restrictDomain?: number;
                    /**
                     * @description Set value to `1` to force the use of proxy IPs for the crawl. This will utilize proxy servers for both crawling and processing of pages.
                     * @default 0
                     */
                    useProxies?: number;
                    /**
                     * @description Specify the depth of your crawl. A `maxHops=0` will limit **processing** to the seed URL(s) only -- no other links will be processed; `maxHops=1` will process all (otherwise matching) pages whose links appear on seed URL(s); `maxHops=2` will process pages whose links appear on those pages; and so on.
                     *
                     *     By default (`maxHops=-1`) Crawl will crawl and process links at any depth.
                     * @default -1
                     */
                    maxHops?: number;
                    /** @description Send a message to this email address when the crawl hits the `maxToCrawl` or `maxToProcess` limit, or when the crawl completes. */
                    notifyEmail?: string;
                    /** @description Pass a URL to be notified when the crawl hits the `maxToCrawl` or `maxToProcess` limit, or when the crawl completes. You will receive a POST with `X-Crawl-Name` and `X-Crawl-Status` in the headers, and the job's JSON metadata in the POST body. Note that in webhook POSTs the parent `jobs` will not be sent—only the individual job object will be returned. */
                    notifyWebhook?: string;
                    /** @description Specify the number of days as a floating-point (e.g. `repeat=7.0`) to repeat this crawl. By default crawls will not be repeated. */
                    repeat?: number;
                    /**
                     * @description Useful for specifying a frequency, in number of days, to recrawl seed urls, which is independent of the overall recrawl frequency given by `repeat`. Defaults to `seedRecrawlFrequency=-1` to use the default frequency.
                     * @default -1
                     */
                    seedRecrawlFrequency?: number;
                    /**
                     * @description Specify the maximum number of crawl repeats. By default (`maxRounds=0`) repeating crawls will continue indefinitely.
                     * @default 0
                     */
                    maxRounds?: number;
                    /**
                     * @description Specify ||-separated **strings** to limit pages crawled to those whose URLs contain *any* of the content strings. You can use the exclamation point to specify a negative string, e.g. `!product` to exclude URLs containing the string "product," and the `^` and `$` characters to limit matches to the beginning or end of the URL.
                     *
                     *     The use of a `urlCrawlPattern` will allow Crawl to spider outside of the seed domain; it will follow all matching URLs regardless of domain.
                     */
                    urlCrawlPattern?: string;
                    /** @description Specify a regular expression to limit pages **crawled** to those URLs that contain a match to your expression. This will override any `urlCrawlPattern` value. */
                    urlCrawlRegEx?: string;
                    /**
                     * @description Specify max pages to spider. Default: 100,000.
                     * @default 100000
                     */
                    maxToCrawl?: number;
                    /**
                     * @description Specify max pages to spider per subdomain. Default: no limit (-1)
                     * @default -1
                     */
                    maxToCrawlPerSubdomain?: number;
                    /** @description Wait this many seconds between each URL crawled from a single IP address. Specify the number of seconds as an integer or floating-point number (e.g., `crawlDelay=0.25`). */
                    crawlDelay?: number;
                    /** @description Specify ||-separated **strings** to limit pages processed to those whose URLs contain *any* of the content strings. You can use the exclamation point to specify a negative string, e.g. `!/category` to exclude URLs containing the string "/category," and the `^` and `$` characters to limit matches to the beginning or end of the URL. */
                    urlProcessPattern?: string;
                    /** @description Specify a regular expression to limit pages **processed** to those URLs that contain a match to your expression. This will override any `urlProcessPattern` value. */
                    urlProcessRegEx?: string;
                    /** @description Specify ||-separated strings to limit pages **processed** to those whose HTML contains *any* of the content strings. */
                    pageProcessPattern?: string;
                    /**
                     * @description Specify max pages to process through Diffbot APIs. Default: 100,000.
                     * @default 100000
                     */
                    maxToProcess?: number;
                    /**
                     * @description Specify max pages to process per subdomain. Default: no limit (-1)
                     * @default -1
                     */
                    maxToProcessPerSubdomain?: number;
                    /**
                     * @description By default repeat crawls will only process new (previously unprocessed) pages. Set to 0 (`onlyProcessIfNew=0`) to process all content on repeat crawls.
                     * @default 1
                     */
                    onlyProcessIfNew?: number;
                };
            };
        };
        responses: {
            /** @description Crawl job created */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example Successfully added urls for spidering. */
                        response?: string;
                        jobs?: {
                            /** @example -1 */
                            maxToProcessPerSubdomain?: number;
                            jobStatus?: {
                                /** @example Job is initializing. */
                                message?: string;
                                /** @example 0 */
                                status?: number;
                            };
                            /** @example -1 */
                            maxHops?: number;
                            /** @example 1 */
                            onlyProcessIfNew?: number;
                            /** @example https://api.diffbot.com/v3/crawl/download/<REDACTED>.json */
                            downloadJson?: string;
                            /** @example  */
                            urlProcessPattern?: string;
                            /** @example 0 */
                            jobCompletionTimeUTC?: number;
                            /** @example -1 */
                            maxRounds?: number;
                            /** @example 1 */
                            restrictDomain?: number;
                            /** @example crawl */
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
                            /** @example -1 */
                            maxToCrawlPerSubdomain?: number;
                            /** @example 1726163287 */
                            jobCreationTimeUTC?: number;
                            /** @example 0 */
                            repeat?: number;
                            /** @example https://api.diffbot.com/v3/crawl/download/<REDACTED>.csv */
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
                            /** @example 100000 */
                            maxToProcess?: number;
                            /** @example -1 */
                            seedRecrawlFrequency?: number;
                            /** @example https://example.com */
                            seeds?: string;
                            /** @example  */
                            urlProcessRegEx?: string;
                            /** @example 0 */
                            pageProcessSuccesses?: number;
                            /** @example 0 */
                            urlsHarvested?: number;
                            /** @example 0.25 */
                            crawlDelay?: number;
                            /** @example 1726163288 */
                            currentTime?: number;
                            /** @example 0 */
                            useProxies?: number;
                            /** @example 100000 */
                            maxToCrawl?: number;
                            /** @example 0 */
                            sentJobDoneNotification?: number;
                            /** @example 1726163288 */
                            currentTimeUTC?: number;
                            /** @example 0 */
                            restrictSubdomain?: number;
                            /** @example test-crawl */
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
            /** @description Too many collections for token — the 1,000-crawl limit has been reached */
            505: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 505 */
                        errorCode?: number;
                        /** @example Too many collections for token */
                        error?: string;
                    };
                };
            };
        };
    };
    "retrieve-crawl-job-data": {
        parameters: {
            query: {
                /** @description Name of the crawl job whose data you wish to download. */
                name: string;
                /** @description Request `format=csv` to download the extracted data in CSV format (default: `json`). Note that CSV files will only contain top-level fields. */
                format?: string;
                /** @description Request `type=urls` to retrieve the [URL Report (CSV)](/products/crawl/faq/url-report). */
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
            /** @description The crawl job's extracted data */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": ({
                        /**
                         * @description Name of the Crawl or Bulk job this record was extracted from
                         * @example example-test
                         */
                        col: string;
                        /**
                         * @description Immediate parent contained a link to this record
                         * @example https://www.example.com
                         */
                        parentUrl: string;
                        /**
                         * @description The URL of this record
                         * @example https://www.example.com/
                         */
                        pageUrl: string;
                        /**
                         * @description A reference
                         * @example 1492074227214006500
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
                         * @example 2026-07-24T23:15:09Z
                         */
                        timestamp: string;
                    } & {
                        [key: string]: unknown;
                    })[];
                };
            };
            /** @description No crawl job by that name */
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
