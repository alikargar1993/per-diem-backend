import { fetchCatalogSnapshot } from "../lib/catalog/fetch-catalog.js";
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

export async function getMenuForLocation(
  locationId: string,
): Promise<MenuResponseDto> {
  const locations = await listLocations();
  const location = locations.find((loc) => loc.id === locationId);

  if (!location) {
    throw notFound(`Location not found: ${locationId}`);
  }

  const { objects } = await fetchCatalogSnapshot();
  console.log("objects", objects);
  const imageUrlMap = buildImageUrlMap(objects);

  const categories = mapCategories(objects, locationId);
  const items = mapItems(objects, imageUrlMap, locationId);
  const grouped = groupMenuByCategory(categories, items);

  return {
    locationId,
    categories: grouped.categories,
    uncategorized: grouped.uncategorized,
  };
}

export async function getItemDetail(
  itemId: string,
  locationId: string,
): Promise<MenuItemDto> {
  const locations = await listLocations();
  if (!locations.some((loc) => loc.id === locationId)) {
    throw notFound(`Location not found: ${locationId}`);
  }

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

  const item = mapItem(raw, imageUrlMap);
  if (!item) {
    throw notFound(`Item not found: ${itemId}`);
  }

  return item;
}
