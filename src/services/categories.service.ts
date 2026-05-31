import type { CategoriesResponseDto } from "../types/api.js";
import { loadCatalogView } from "./catalog-context.service.js";

export async function listCategories(): Promise<CategoriesResponseDto> {
  const { categories } = await loadCatalogView();

  return {
    categories,
    total: categories.length,
  };
}
