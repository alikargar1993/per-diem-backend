import type { FastifyInstance } from "fastify";
import { catalogRoutes } from "./catalog.js";
import { locationRoutes } from "./locations.js";
import { menuRoutes } from "./menu.js";
import { searchRoutes } from "./search.js";

export async function apiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(locationRoutes);
  await app.register(catalogRoutes);
  await app.register(menuRoutes);
  await app.register(searchRoutes);
}
