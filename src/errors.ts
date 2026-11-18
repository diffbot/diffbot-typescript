/** Exception hierarchy for the Diffbot SDK. */

import { tryParseErrorBody } from "./decode.js";

export class DiffbotError extends Error {
  override name = "DiffbotError";
}

export class ValidationError extends DiffbotError {
  override name = "ValidationError";
}

export class APIError extends DiffbotError {
  statusCode: number;
  body: string;
  apiMessage: string | undefined;
  requestId: string | undefined;
  headers: Record<string, string> | undefined;

  constructor(statusCode: number, body: string, headers?: Record<string, string>) {
    const { message: apiMessage, requestId } = tryParseErrorBody(body);
    const display = apiMessage ?? (body.length > 200 ? `${body.slice(0, 200)}...` : body);
    super(`Diffbot API error ${statusCode.toString()}: ${display}`);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.body = body;
    this.apiMessage = apiMessage;
    this.requestId = requestId;
    this.headers = headers;
  }
}

export class AuthError extends APIError {
  override name = "AuthError";
}

export class RateLimitError extends APIError {
  retryAfter: string | undefined;
  override name = "RateLimitError";

  constructor(
    statusCode: number,
    body: string,
    retryAfter?: string | null,
    headers?: Record<string, string>,
  ) {
    super(statusCode, body, headers);
    this.retryAfter = retryAfter ?? undefined;
  }
}

/** A 404 from an endpoint with a documented "not found" shape (e.g. a missing job or report). */
export class NotFoundError extends APIError {
  override name = "NotFoundError";
}

/**
 * A job (crawl or bulk) that completed its HTTP request successfully but reports a
 * failed status internally. Subclasses `APIError` so existing `catch (APIError)` sites
 * keep working; `instanceof JobError` distinguishes it from a transport-level failure.
 */
export class JobError extends APIError {
  override name = "JobError";
  jobName: string;

  constructor(jobName: string, message: string) {
    super(500, message);
    this.jobName = jobName;
  }
}

export class ExtractionError extends DiffbotError {
  errorCode: number;
  error: string;
  override name = "ExtractionError";

  constructor(errorCode: number, error: string) {
    super(`Diffbot extraction error ${errorCode.toString()}: ${error}`);
    this.errorCode = errorCode;
    this.error = error;
  }
}
