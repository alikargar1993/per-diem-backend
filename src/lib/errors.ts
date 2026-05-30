/**
 * Application errors with HTTP status codes.
 * Square SDK errors are mapped here so route handlers stay thin and clients
 * get consistent JSON instead of leaking vendor response shapes.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: string;
      details?: unknown;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.details = options.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function notFound(message: string, code = "NOT_FOUND"): AppError {
  return new AppError(message, { statusCode: 404, code });
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(message, {
    statusCode: 400,
    code: "BAD_REQUEST",
    details,
  });
}

export function upstreamError(
  message: string,
  options: { cause?: unknown; details?: unknown } = {},
): AppError {
  return new AppError(message, {
    statusCode: 502,
    code: "UPSTREAM_ERROR",
    cause: options.cause,
    details: options.details,
  });
}

export function rateLimited(message = "Upstream rate limit exceeded"): AppError {
  return new AppError(message, { statusCode: 429, code: "RATE_LIMITED" });
}
