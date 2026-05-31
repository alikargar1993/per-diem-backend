import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError, isAppError } from "../lib/errors.js";

type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function sendError(
  reply: FastifyReply,
  statusCode: number,
  body: ErrorResponse,
): FastifyReply {
  return reply.status(statusCode).send(body);
}

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler(
    (error: FastifyError | Error, _request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof ZodError) {
        return sendError(reply, 400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: error.flatten(),
          },
        });
      }

      if (isAppError(error)) {
        return sendError(reply, error.statusCode, {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      }

      const statusCode =
        "statusCode" in error &&
        typeof error.statusCode === "number" &&
        error.statusCode >= 400 &&
        error.statusCode < 600
          ? error.statusCode
          : 500;

      app.log.error(error);

      return sendError(reply, statusCode, {
        error: {
          code: "INTERNAL_ERROR",
          message:
            statusCode === 500 ? "An unexpected error occurred" : error.message,
        },
      });
    },
  );
}
