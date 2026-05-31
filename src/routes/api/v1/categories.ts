import type { FastifyInstance } from "fastify";
import { listCategories } from "../../../services/categories.service.js";

export async function categoriesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/categories", async () => listCategories());
}
