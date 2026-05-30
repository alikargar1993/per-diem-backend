import type { FastifyInstance } from "fastify";
import { listLocations } from "../../services/locations.service.js";

export async function locationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/locations", async () => {
    const locations = await listLocations();
    return { locations };
  });
}
