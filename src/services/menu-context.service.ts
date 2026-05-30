import { fetchCatalogSnapshot } from "../lib/catalog/fetch-catalog.js";
import { buildAvailabilityContextForMenu } from "../lib/catalog/availability.js";
import type { AvailabilityContext } from "../lib/catalog/availability.js";
import {
  buildImageUrlMap,
  mapCategories,
  mapItems,
} from "../lib/catalog/map-catalog.js";
import { notFound } from "../lib/errors.js";
import type { CategoryDto, MenuItemDto } from "../types/api.js";
import { listLocations } from "./locations.service.js";

export type MenuQuery = {
  locationId: string;
  /** Client device time as ISO 8601. When omitted, server machine local time is used. */
  at?: Date;
};

export type VisibleMenuContext = {
  locationId: string;
  availability: AvailabilityContext;
  categories: CategoryDto[];
  items: MenuItemDto[];
};

/** Loads catalog objects filtered by location and meal-period availability. */
export async function loadVisibleMenu(
  query: MenuQuery,
): Promise<VisibleMenuContext> {
  const { locationId, at } = query;
  const locations = await listLocations();
  const location = locations.find((loc) => loc.id === locationId);

  if (!location) {
    throw notFound(`Location not found: ${locationId}`);
  }

  const availability = buildAvailabilityContextForMenu(at, location.timezone);
  const { objects } = await fetchCatalogSnapshot();
  const imageUrlMap = buildImageUrlMap(objects);

  const categories = mapCategories(objects, locationId);
  const items = mapItems(objects, imageUrlMap, { locationId, availability });

  return { locationId, availability, categories, items };
}

export function toMenuAvailabilityDto(
  availability: AvailabilityContext,
): {
  referenceTime: string;
  timezone: string;
  activePeriods: AvailabilityContext["activePeriods"];
} {
  return {
    referenceTime: availability.referenceTime.toISOString(),
    timezone: availability.timezone,
    activePeriods: availability.activePeriods,
  };
}
