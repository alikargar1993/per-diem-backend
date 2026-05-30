import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { searchMenu } from "../../services/search.service.js";

const searchQuerySchema = z.object({
  locationId: z.string().min(1, "locationId is required"),
  q: z.string().trim().min(1, "q is required"),
  at: z.coerce.date().optional(),
});

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get("/search", async (request) => {
    const query = searchQuerySchema.parse(request.query);
    return searchMenu(query);
  });
}
