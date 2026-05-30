import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getItemDetail, getMenuForLocation } from "../../services/menu.service.js";

const locationQuerySchema = z.object({
  locationId: z.string().min(1, "locationId is required"),
});

export async function menuRoutes(app: FastifyInstance): Promise<void> {
  app.get("/menu", async (request) => {
    const { locationId } = locationQuerySchema.parse(request.query);
    return getMenuForLocation(locationId);
  });

  app.get("/items/:itemId", async (request) => {
    const { itemId } = request.params as { itemId: string };
    const { locationId } = locationQuerySchema.parse(request.query);
    const item = await getItemDetail(itemId, locationId);
    return { item };
  });
}
