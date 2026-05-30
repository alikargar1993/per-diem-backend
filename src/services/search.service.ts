import { searchMenuItems } from "../lib/catalog/search.js";
import type { SearchResponseDto } from "../types/api.js";
import { loadCatalogView } from "./catalog-context.service.js";
import { toMenuAvailabilityDto } from "./menu-context.service.js";

export type SearchQuery = {
  q: string;
  locationId?: string;
  at?: Date;
};

export async function searchItems(query: SearchQuery): Promise<SearchResponseDto> {
  const { q, locationId, at } = query;
  const { availability, categories, items } = await loadCatalogView({
    locationId,
    at,
  });

  const results = searchMenuItems(items, categories, q);

  return {
    query: q.trim(),
    locationId,
    availability: toMenuAvailabilityDto(availability),
    items: results,
    total: results.length,
  };
}
