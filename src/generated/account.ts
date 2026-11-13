/**
 * Generated from openapi/account.json by `pnpm gen:types`. Do not hand-edit.
 * Source: openapi-typescript v7.13.0
 */
export interface paths {
    "/account": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Account Details
         * @description Returns account plan, usage, child tokens, and other account details.
         */
        get: operations["account"];
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
    account: {
        parameters: {
            query?: {
                /** @description Pass the number of days (`&days=365`) for which you would like to retrieve API call volumes (default = 31). */
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful API Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "created": "2020-04-22",
                     *       "usage": [
                     *         {
                     *           "date": "2022-05-04",
                     *           "subtitles": 0,
                     *           "nlp": 0,
                     *           "entities": 10,
                     *           "credits": 258,
                     *           "refresh": 0,
                     *           "proxies": 0,
                     *           "videos": 0,
                     *           "extractions": 8,
                     *           "facets": 0
                     *         },
                     *         {
                     *           "date": "2022-05-03",
                     *           "subtitles": 0,
                     *           "nlp": 0,
                     *           "entities": 75,
                     *           "credits": 1875,
                     *           "refresh": 0,
                     *           "proxies": 0,
                     *           "videos": 0,
                     *           "extractions": 0,
                     *           "facets": 0
                     *         }
                     *       ],
                     *       "name": "Diffy",
                     *       "childTokens": [
                     *         "xxxx",
                     *         "xxxx"
                     *       ],
                     *       "plan": "diffy-plans-to-hangout-all-day",
                     *       "email": "sales@diffbot.com",
                     *       "token": "xxxx",
                     *       "status": "active"
                     *     }
                     */
                    "application/json": {
                        /** @description Name associated with the token. */
                        name?: string;
                        /** @description Email address associated with the token. */
                        email?: string;
                        /** @description Current plan for the token. */
                        plan?: string;
                        /** @description Amount of monthly calls included. */
                        planCredits?: number;
                        /** @description Status of the token. */
                        status?: string;
                        /** Format: date */
                        created?: string;
                        token?: string;
                        /** @description List of child or sub-tokens, if there are any associated with your account. */
                        childTokens?: string[];
                        /** @description An array of days and call volume amounts for each day. By default this will return data from the most recent 31 days. Use the `days` argument to adjust the response window. Dates prior to token becoming active will not be returned. */
                        usage?: {
                            /**
                             * Format: date
                             * @description Date, e.g. `2019-12-01`.
                             */
                            date?: string;
                            /** @description Total number of Natural Language API calls made. */
                            nlp?: number;
                            /** @description Total number of credits consumed. */
                            credits?: number;
                            /** @description Total number of Extraction API calls made. */
                            extractions?: number;
                            /** @description Total number of calls made using proxy servers. [Read more](/docs/extract/using-proxies). */
                            proxies?: number;
                            /** @description Total number of entities downloaded from the Diffbot Knowledge Graph. */
                            entities?: number;
                            /** @description Total number of entity refreshes requested. */
                            refresh?: number;
                            /** @description Total number of facet values returned. */
                            facets?: number;
                            /** @description Total number of videos downloaded. */
                            videos?: number;
                            /** @description Total number of subtitles requested. */
                            subtitles?: number;
                        }[];
                    };
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "errorCode": 401,
                     *       "error": "Not authorized API token."
                     *     }
                     */
                    "application/json": {
                        /** @example 401 */
                        errorCode?: number;
                        /** @example Not authorized API token. */
                        error?: string;
                    };
                };
            };
        };
    };
}
