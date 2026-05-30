import { SquareError } from "square";
import { AppError, rateLimited, upstreamError } from "../errors.js";

/**
 * Square's Node SDK throws SquareError with statusCode and structured errors[].
 * We normalize those into AppError so Fastify's error handler can respond uniformly.
 */
export function mapSquareError(error: unknown, context: string): AppError {
  if (error instanceof SquareError) {
    const status = error.statusCode;

    if (status === 429) {
      return rateLimited(`${context}: rate limited by Square`);
    }

    const squareErrors = error.errors.map((e) => ({
      category: e.category,
      code: e.code,
      detail: "detail" in e ? e.detail : undefined,
      field: "field" in e ? e.field : undefined,
    }));

    return upstreamError(`${context}: Square API error`, {
      cause: error,
      details: { status, errors: squareErrors },
    });
  }

  if (error instanceof Error) {
    return upstreamError(`${context}: ${error.message}`, { cause: error });
  }

  return upstreamError(`${context}: unknown error`, { cause: error });
}
