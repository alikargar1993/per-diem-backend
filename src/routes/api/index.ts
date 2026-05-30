import type { FastifyInstance } from "fastify";
import { v1Routes } from "./v1/index.js";

export async function apiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(v1Routes);
}
