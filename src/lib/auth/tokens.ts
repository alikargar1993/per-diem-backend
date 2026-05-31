import { timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { authEnv, isRefreshTokenEnabled } from "../../config/auth.js";
import { unauthorized } from "../errors.js";

export type AuthPolicy = "public" | "general" | "refresh";

const BEARER_PREFIX = "Bearer ";

const READ_METHODS = new Set(["GET", "HEAD"]);

/** Reads token from Authorization: Bearer or X-Api-Token. */
export function extractApiToken(request: FastifyRequest): string | null {
  const headerToken = request.headers["x-api-token"];
  if (typeof headerToken === "string" && headerToken.length > 0) {
    return headerToken.trim();
  }

  const authorization = request.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith(BEARER_PREFIX)) {
    return authorization.slice(BEARER_PREFIX.length).trim();
  }

  return null;
}

function safeEqualToken(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(providedBuf, Buffer.alloc(providedBuf.length));
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * GET/HEAD → general token.
 * POST, PUT, PATCH, DELETE, … → refresh token when API_REFRESH_TOKEN is set;
 * otherwise falls back to general token so the server can start without refresh config.
 */
export function resolveAuthPolicyForRequest(request: FastifyRequest): AuthPolicy {
  const routePolicy = request.routeOptions.config?.auth;
  if (routePolicy) return routePolicy;

  const method = request.method.toUpperCase();

  if (method === "OPTIONS") return "public";

  if (READ_METHODS.has(method) || !isRefreshTokenEnabled()) {
    return "general";
  }

  return "refresh";
}

export function assertAuthPolicy(
  request: FastifyRequest,
  policy: AuthPolicy,
): void {
  if (policy === "public") return;

  const effectivePolicy =
    policy === "refresh" && !isRefreshTokenEnabled() ? "general" : policy;

  const token = extractApiToken(request);
  if (!token) {
    const hint =
      effectivePolicy === "refresh"
        ? "API_REFRESH_TOKEN"
        : "API_GENERAL_TOKEN";
    throw unauthorized(
      `Missing API token. Send Authorization: Bearer <${hint}> or X-Api-Token header.`,
    );
  }

  const expected =
    effectivePolicy === "refresh" && authEnv.API_REFRESH_TOKEN
      ? authEnv.API_REFRESH_TOKEN
      : authEnv.API_GENERAL_TOKEN;

  if (!safeEqualToken(token, expected)) {
    const hint =
      effectivePolicy === "refresh" ? "API_REFRESH_TOKEN" : "API_GENERAL_TOKEN";
    throw unauthorized(`Invalid API token (expected ${hint})`);
  }
}
