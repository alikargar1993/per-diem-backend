import type { CatalogResponseDto } from "../types/api.js";
import { loadCatalogView } from "./catalog-context.service.js";

export async function getCatalog(): Promise<CatalogResponseDto> {
  const { categories, items } = await loadCatalogView();

  return { categories, items };
}
