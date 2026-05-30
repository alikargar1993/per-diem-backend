import type { FastifyInstance } from "fastify";
import { registerAuthenticatedRoutes } from "../../../plugins/auth.js";
import { catalogRoutes } from "./catalog.js";
import { locationRoutes } from "./locations.js";
import { menuRoutes } from "./menu.js";
import { searchRoutes } from "./search.js";

/**
 * Auth by HTTP method:
 * - GET/HEAD → API_GENERAL_TOKEN
 * - POST, PUT, PATCH, DELETE, … → API_REFRESH_TOKEN
 */
export async function v1Routes(app: FastifyInstance): Promise<void> {
  await registerAuthenticatedRoutes(app, async (scoped) => {
    await scoped.register(locationRoutes);
    await scoped.register(catalogRoutes);
    await scoped.register(menuRoutes);
    await scoped.register(searchRoutes);
  });
}
