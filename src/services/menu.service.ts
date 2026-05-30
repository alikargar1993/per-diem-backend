import { fetchCatalogSnapshot } from "../lib/catalog/fetch-catalog.js";
import {
  buildAvailabilityContextForMenu,
  isItemAvailableNow,
} from "../lib/catalog/availability.js";
import {
  buildImageUrlMap,
  groupMenuByCategory,
  mapCategories,
  mapItem,
  mapItems,
} from "../lib/catalog/map-catalog.js";
import { isPresentAtLocation } from "../lib/catalog/location-presence.js";
import { notFound } from "../lib/errors.js";
import type { Square } from "square";
import type { MenuItemDto, MenuResponseDto } from "../types/api.js";
import { listLocations } from "./locations.service.js";

export type MenuQuery = {
  locationId: string;
  /** Client device time as ISO 8601. When omitted, server machine local time is used. */
  at?: Date;
};

export async function getMenuForLocation(
  query: MenuQuery,
): Promise<MenuResponseDto> {
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
  const grouped = groupMenuByCategory(categories, items);

  return {
    locationId,
    availability: {
      referenceTime: availability.referenceTime.toISOString(),
      timezone: availability.timezone,
      activePeriods: availability.activePeriods,
    },
    categories: grouped.categories,
    uncategorized: grouped.uncategorized,
  };
}

export async function getItemDetail(
  itemId: string,
  query: MenuQuery,
): Promise<MenuItemDto> {
  const { locationId, at } = query;
  const locations = await listLocations();
  const location = locations.find((loc) => loc.id === locationId);

  if (!location) {
    throw notFound(`Location not found: ${locationId}`);
  }

  const availability = buildAvailabilityContextForMenu(at, location.timezone);
  const { objects } = await fetchCatalogSnapshot();
  const imageUrlMap = buildImageUrlMap(objects);

  const raw = objects.find(
    (object): object is Square.CatalogObject.Item =>
      object.type === "ITEM" && object.id === itemId,
  );

  if (!raw || raw.isDeleted) {
    throw notFound(`Item not found: ${itemId}`);
  }

  if (!isPresentAtLocation(raw, locationId)) {
    throw notFound(`Item is not available at location: ${locationId}`);
  }

  if (!isItemAvailableNow(raw, availability)) {
    throw notFound(`Item is not available at this time`);
  }

  const item = mapItem(raw, imageUrlMap, availability);
  if (!item) {
    throw notFound(`Item not found: ${itemId}`);
  }

  return item;
}
