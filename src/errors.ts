/** Exception hierarchy for the Diffbot SDK. */

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

  constructor(statusCode: number, body: string) {
    let apiMessage: string | undefined;
    let requestId: string | undefined;
    try {
      const data = JSON.parse(body) as { message?: string; requestId?: string };
      apiMessage = data.message;
      requestId = data.requestId;
    } catch {
      /* ignore parse errors */
    }
    const display = apiMessage ?? (body.length > 200 ? `${body.slice(0, 200)}...` : body);
    super(`Diffbot API error ${statusCode}: ${display}`);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.body = body;
    this.apiMessage = apiMessage;
    this.requestId = requestId;
  }

}

export class AuthError extends APIError {
  override name = "AuthError";
}

export class RateLimitError extends APIError {
  retryAfter: string | undefined;
  override name = "RateLimitError";

  constructor(statusCode: number, body: string, retryAfter?: string | null) {
    super(statusCode, body);
    this.retryAfter = retryAfter ?? undefined;
  }
}

export class ExtractionError extends DiffbotError {
  errorCode: number;
  error: string;
  override name = "ExtractionError";

  constructor(errorCode: number, error: string) {
    super(`Diffbot extraction error ${errorCode}: ${error}`);
    this.errorCode = errorCode;
    this.error = error;
  }
}
