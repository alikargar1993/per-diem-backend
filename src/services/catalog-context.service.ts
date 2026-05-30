import { fetchCatalogSnapshot } from "../lib/catalog/fetch-catalog.js";
import {
  buildAvailabilityContext,
  buildAvailabilityContextForMenu,
  getMachineTimezone,
  type AvailabilityContext,
} from "../lib/catalog/availability.js";
import {
  buildImageUrlMap,
  mapCategories,
  mapItems,
} from "../lib/catalog/map-catalog.js";
import { notFound } from "../lib/errors.js";
import type { CategoryDto, MenuItemDto } from "../types/api.js";
import { listLocations } from "./locations.service.js";

export type CatalogViewQuery = {
  /** When set, filters items/categories by Square location presence fields. */
  locationId?: string;
  /** Meal-period filter; with location uses location TZ + machine TZ when `at` omitted. */
  at?: Date;
};

export type CatalogView = {
  locationId?: string;
  availability: AvailabilityContext;
  categories: CategoryDto[];
  items: MenuItemDto[];
};

function buildAvailability(
  at: Date | undefined,
  locationTimezone: string | null,
): AvailabilityContext {
  return buildAvailabilityContextForMenu(at, locationTimezone);
}

/** Loads categories and items from Square catalog, optionally scoped to a location. */
export async function loadCatalogView(
  query: CatalogViewQuery = {},
): Promise<CatalogView> {
  const { locationId, at } = query;

  let locationTimezone: string | null = null;
  if (locationId) {
    const locations = await listLocations();
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) {
      throw notFound(`Location not found: ${locationId}`);
    }
    locationTimezone = location.timezone;
  }

  const availability = locationId
    ? buildAvailability(query.at, locationTimezone)
    : buildAvailabilityContext(at ?? new Date(), getMachineTimezone());

  const { objects } = await fetchCatalogSnapshot();
  const imageUrlMap = buildImageUrlMap(objects);

  const categories = mapCategories(objects, locationId);
  const items = mapItems(objects, imageUrlMap, { locationId, availability });

  return {
    locationId,
    availability,
    categories,
    items,
  };
}
