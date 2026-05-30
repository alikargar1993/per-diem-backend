import type { AvailabilityContext } from "../lib/catalog/availability.js";
import { notFound } from "../lib/errors.js";
import type { CategoryDto, MenuItemDto } from "../types/api.js";
import { loadCatalogView, type CatalogViewQuery } from "./catalog-context.service.js";

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
  const view = await loadCatalogView(query as CatalogViewQuery);

  if (!view.locationId) {
    throw notFound(`Location not found: ${query.locationId}`);
  }

  return {
    locationId: view.locationId,
    availability: view.availability,
    categories: view.categories,
    items: view.items,
  };
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
