import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { searchItems } from "../../../services/search.service.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "q is required"),
  /** Optional — when omitted, searches the full catalog (all locations). */
  locationId: z.string().min(1).optional(),
  at: z.coerce.date().optional(),
});

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get("/search", async (request) => {
    const query = searchQuerySchema.parse(request.query);
    return searchItems(query);
  });
}
