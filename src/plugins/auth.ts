import type { FastifyInstance } from "fastify";
import {
  assertAuthPolicy,
  resolveAuthPolicyForRequest,
  type AuthPolicy,
} from "../lib/auth/tokens.js";

declare module "fastify" {
  interface FastifyContextConfig {
    /** Override method-based auth (public / general / refresh). */
    auth?: AuthPolicy;
  }
}

/**
 * Registers /api routes with method-based auth in a single encapsulation context.
 */
export async function registerAuthenticatedRoutes(
  app: FastifyInstance,
  registerRoutes: (scoped: FastifyInstance) => Promise<void>,
): Promise<void> {
  await app.register(async (scoped) => {
    scoped.addHook("preHandler", async (request) => {
      const policy = resolveAuthPolicyForRequest(request);
      assertAuthPolicy(request, policy);
    });

    await registerRoutes(scoped);
  });
}
