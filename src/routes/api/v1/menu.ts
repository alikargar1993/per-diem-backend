import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getItemDetail, getMenuForLocation } from "../../../services/menu.service.js";

const menuQuerySchema = z.object({
  locationId: z.string().min(1, "locationId is required"),
  /**
   * Client device time (ISO 8601), resolved in the location timezone.
   * When omitted, the server uses its machine local time of day.
   */
  at: z.coerce.date().optional(),
});

export async function menuRoutes(app: FastifyInstance): Promise<void> {
  app.get("/menu", async (request) => {
    const query = menuQuerySchema.parse(request.query);
    return getMenuForLocation(query);
  });

  app.get("/items/:itemId", async (request) => {
    const { itemId } = request.params as { itemId: string };
    const query = menuQuerySchema.parse(request.query);
    const item = await getItemDetail(itemId, query);
    return { item };
  });
}
