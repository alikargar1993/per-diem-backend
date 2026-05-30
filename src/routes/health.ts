import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    squareEnvironment: env.SQUARE_ENVIRONMENT,
  }));
}
