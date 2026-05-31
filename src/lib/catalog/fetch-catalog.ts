import type { Square } from "square";
import { getSquareClient } from "../square/client.js";
import { withSquare } from "../square/with-square.js";

const CATALOG_TYPES = "ITEM,CATEGORY,IMAGE";
const CACHE_TTL_MS = 5 * 60 * 1000;

export type CatalogSnapshot = {
  objects: Square.CatalogObject[];
  fetchedAt: number;
};

let cached: CatalogSnapshot | null = null;

/**
 * Fetches the full catalog with pagination. Short TTL cache reduces duplicate
 * Square calls when the client loads catalog then menu for the same location.
 */
export async function fetchCatalogSnapshot(
  options: { bypassCache?: boolean } = {},
): Promise<CatalogSnapshot> {
  const now = Date.now();

  if (
    !options.bypassCache &&
    cached &&
    now - cached.fetchedAt < CACHE_TTL_MS
  ) {
    return cached;
  }

  const objects = await withSquare("list catalog", async () => {
    const client = getSquareClient();
    const collected: Square.CatalogObject[] = [];
    let page = await client.catalog.list({ types: CATALOG_TYPES });

    collected.push(...page.data);

    while (page.hasNextPage()) {
      page = await page.getNextPage();
      collected.push(...page.data);
    }

    return collected;
  });

  cached = { objects, fetchedAt: now };
  return cached;
}

/** Clears in-memory catalog cache (useful after sandbox seed changes). */
export function clearCatalogCache(): void {
  cached = null;
}
