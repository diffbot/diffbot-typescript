/**
 * Generated from openapi/web-search.json by `pnpm gen:types`. Do not hand-edit.
 * Source: openapi-typescript v7.13.0
 */
export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Run a Web Search
         * @description Search Diffbot's Web Index
         */
        get: operations["get_"];
        put?: never;
        /** Run a Web Search */
        post: operations["post_"];
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
         * @description Your search query.
         *
         *     Use the following operators to refine your search.
         *
         *     | Operator | Description | Example |
         *     | --- | --- | --- |
         *     | `after` | Documents published after the provided date | `after:2026-06-10` |
         *     | `before` | Documents published before the provided date | `before:2026-05-10` |
         *     | `site` | Documents matching the provided domain | `site:diffbot.com` |
         *     | `url` | Documents matching the exact URL | `url:diffbot.com` |
         */
        Query: string[];
        /**
         * @description Number of results to return in the search response
         * @default 10
         */
        Size: number;
        /** @description Cap the search response to this value. Highlight chunks will be reduced in length equitably. */
        MaxTokens: number;
    };
    responses: {
        /** @description Successful response */
        Results: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description The parsed query terms. */
                    query?: string[];
                    /** @description The ranked results. */
                    search_results?: {
                        /**
                         * @description Represents the confidence of the result from 0 (lowest) to highest (1). 3 decimal places of precision.
                         * @default 0
                         * @example 0.973
                         */
                        score: number;
                        /**
                         * @description URL of the page.
                         * @example https://www.diffbot.com/
                         */
                        pageUrl?: string;
                        /**
                         * @description Title of the page.
                         * @example Web Data for your AI
                         */
                        title?: string;
                        /**
                         * @description A spliced chunk highlight from the original full page contents.
                         * @example Imagine if your app could access the web like a structured database.
                         *
                         *      Your browser does not support the video tag.
                         *     - 50+ data fields, including categories, revenue, locations, and investments
                         *     - Over 246M companies and non-profits in the Knowledge Graph
                         *     - Extract and refresh orgs on demand
                         *
                         *     - More than just text — entity matching, topic-level sentiment, and more
                         *     - Over 1.6B news articles, blog posts, and press releases in the Knowledge Graph
                         *
                         *
                         *     ##  The Web is Noisy,
                         *     Diffbot Straightens it Out
                         *
                         *     The world's largest compendium of human knowledge is buried in the code of 1.2 billion public websites. Diffbot reads it all like a human, then transforms it into usable data.
                         */
                        content?: string;
                        /**
                         * @description Publication date of the page, when known. RFC 1123 format. Omitted when the page has no discoverable publication date.
                         * @example Thu, 12 Mar 2026 00:00:00 GMT
                         */
                        date?: string;
                    }[];
                    /**
                     * @description Time taken for retrieval, reranking, and response generation.
                     * @default 0
                     * @example 154
                     */
                    timeMs: number;
                };
            };
        };
        /** @description Unauthorized */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /**
                     * @default 0
                     * @example 401
                     */
                    code: number;
                    /** @example Missing or invalid Authorization header. Expected: Bearer <token> */
                    message?: string;
                };
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
    get_: {
        parameters: {
            query: {
                text: components["schemas"]["Query"];
                size?: components["schemas"]["Size"];
                maxTokens?: components["schemas"]["MaxTokens"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Results"];
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        errors?: string[];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    post_: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    text: components["schemas"]["Query"];
                    size?: components["schemas"]["Size"];
                    maxTokens?: components["schemas"]["MaxTokens"];
                };
            };
        };
        responses: {
            200: components["responses"]["Results"];
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 400 */
                        code?: number;
                        /** @example Missing text parameter */
                        message?: string;
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
}
