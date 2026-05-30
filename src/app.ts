import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { healthRoutes } from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(cors, {
    // Explicit origins only — avoids reflecting arbitrary Origin headers (SSRF-adjacent foot-gun for credentialed setups).
    origin: env.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await registerErrorHandler(app);
  await app.register(healthRoutes);

  return app;
}
