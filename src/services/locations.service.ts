import type { Square } from "square";
import type { LocationDto } from "../types/api.js";
import { getSquareClient } from "../lib/square/client.js";
import { withSquare } from "../lib/square/with-square.js";

function mapLocation(location: Square.Location): LocationDto | null {
  if (!location.id) return null;

  return {
    id: location.id,
    name: location.name ?? null,
    status: location.status ?? null,
    timezone: location.timezone ?? null,
    addressLine1: location.address?.addressLine1 ?? null,
    locality: location.address?.locality ?? null,
  };
}

export async function listLocations(): Promise<LocationDto[]> {
  const response = await withSquare("list locations", () =>
    getSquareClient().locations.list(),
  );

  const locations = response.locations ?? [];

  return locations
    .map(mapLocation)
    .filter((loc): loc is LocationDto => loc != null)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}
