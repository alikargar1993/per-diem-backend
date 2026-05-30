import type { FastifyInstance } from "fastify";
import { clearCatalogCache } from "../../lib/catalog/fetch-catalog.js";
import { getCatalog } from "../../services/catalog.service.js";

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/catalog", async () => getCatalog());

  // Dev helper after re-seeding sandbox catalog data.
  app.post("/catalog/refresh", async () => {
    clearCatalogCache();
    return getCatalog();
  });
}
