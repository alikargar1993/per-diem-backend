import { searchMenuItems } from "../lib/catalog/search.js";
import type { SearchResponseDto } from "../types/api.js";
import {
  loadVisibleMenu,
  toMenuAvailabilityDto,
  type MenuQuery,
} from "./menu-context.service.js";

export type SearchQuery = MenuQuery & {
  q: string;
};

export async function searchMenu(query: SearchQuery): Promise<SearchResponseDto> {
  const { q, locationId } = query;
  const { availability, categories, items } = await loadVisibleMenu(query);

  const results = searchMenuItems(items, categories, q);

  return {
    query: q.trim(),
    locationId,
    availability: toMenuAvailabilityDto(availability),
    items: results,
    total: results.length,
  };
}
