import type { CategoryDto, MenuItemDto } from "../../types/api.js";

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function textMatches(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle);
}

/**
 * Case-insensitive substring search across item name, description,
 * variation names, and assigned category names (visible-menu scope only).
 */
export function itemMatchesQuery(
  item: MenuItemDto,
  categoryNamesById: Map<string, string>,
  normalizedQuery: string,
): boolean {
  if (textMatches(item.name, normalizedQuery)) return true;
  if (textMatches(item.description, normalizedQuery)) return true;

  for (const variation of item.variations) {
    if (textMatches(variation.name, normalizedQuery)) return true;
  }

  for (const categoryId of item.categoryIds) {
    if (textMatches(categoryNamesById.get(categoryId), normalizedQuery)) {
      return true;
    }
  }

  return false;
}

export function searchMenuItems(
  items: MenuItemDto[],
  categories: CategoryDto[],
  query: string,
): MenuItemDto[] {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const categoryNamesById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return items.filter((item) =>
    itemMatchesQuery(item, categoryNamesById, normalizedQuery),
  );
}
