import {
  groupMenuByCategory,
  mapItem,
} from "../lib/catalog/map-catalog.js";
import { isPresentAtLocation } from "../lib/catalog/location-presence.js";
import { isItemAvailableNow } from "../lib/catalog/availability.js";
import { fetchCatalogSnapshot } from "../lib/catalog/fetch-catalog.js";
import { buildImageUrlMap } from "../lib/catalog/map-catalog.js";
import { notFound } from "../lib/errors.js";
import type { Square } from "square";
import type { MenuItemDto, MenuResponseDto } from "../types/api.js";
import {
  loadVisibleMenu,
  toMenuAvailabilityDto,
  type MenuQuery,
} from "./menu-context.service.js";

export type { MenuQuery } from "./menu-context.service.js";

export async function getMenuForLocation(
  query: MenuQuery,
): Promise<MenuResponseDto> {
  const { locationId, availability, categories, items } =
    await loadVisibleMenu(query);
  const grouped = groupMenuByCategory(categories, items);

  return {
    locationId,
    availability: toMenuAvailabilityDto(availability),
    categories: grouped.categories,
    uncategorized: grouped.uncategorized,
  };
}

export async function getItemDetail(
  itemId: string,
  query: MenuQuery,
): Promise<MenuItemDto> {
  const { locationId } = query;
  const { availability } = await loadVisibleMenu(query);

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
