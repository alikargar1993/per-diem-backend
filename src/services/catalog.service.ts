import { fetchCatalogSnapshot } from "../lib/catalog/fetch-catalog.js";
import {
  buildImageUrlMap,
  mapCategories,
  mapItems,
} from "../lib/catalog/map-catalog.js";
import type { CatalogResponseDto } from "../types/api.js";

export async function getCatalog(): Promise<CatalogResponseDto> {
  const { objects } = await fetchCatalogSnapshot();
  const imageUrlMap = buildImageUrlMap(objects);

  return {
    categories: mapCategories(objects),
    items: mapItems(objects, imageUrlMap, {}),
  };
}
