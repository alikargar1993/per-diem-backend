import type { Square } from "square";
import type {
  CategoryDto,
  ItemVariationDto,
  MenuItemDto,
  MoneyDto,
} from "../../types/api.js";
import { isPresentAtLocation, type LocationPresenceFields } from "./location-presence.js";

function toMoney(money: Square.Money | null | undefined): MoneyDto | null {
  if (money?.amount == null || money.amount === undefined || money.currency == null) {
    return null;
  }

  const amount =
    typeof money.amount === "bigint" ? Number(money.amount) : money.amount;

  return { amount, currency: money.currency };
}

function presenceFields(object: LocationPresenceFields): LocationPresenceFields {
  return {
    presentAtAllLocations: object.presentAtAllLocations,
    presentAtLocationIds: object.presentAtLocationIds,
    absentAtLocationIds: object.absentAtLocationIds,
  };
}

export function buildImageUrlMap(objects: Square.CatalogObject[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const object of objects) {
    if (object.type !== "IMAGE") continue;
    const url = object.imageData?.url;
    if (object.id && url) {
      map.set(object.id, url);
    }
  }

  return map;
}

export function mapCategories(
  objects: Square.CatalogObject[],
  locationId?: string,
): CategoryDto[] {
  const categories: CategoryDto[] = [];

  for (const object of objects) {
    if (object.type !== "CATEGORY" || object.isDeleted) continue;
    if (locationId && !isPresentAtLocation(presenceFields(object), locationId)) {
      continue;
    }

    const name = object.categoryData?.name;
    if (!name || !object.id) continue;

    const ordinalRaw = object.ordinal ?? object.categoryData?.parentCategory?.ordinal;
    categories.push({
      id: object.id,
      name,
      ordinal: ordinalRaw != null ? Number(ordinalRaw) : null,
    });
  }

  return categories.sort((a, b) => {
    const ordA = a.ordinal ?? Number.MAX_SAFE_INTEGER;
    const ordB = b.ordinal ?? Number.MAX_SAFE_INTEGER;
    if (ordA !== ordB) return ordA - ordB;
    return a.name.localeCompare(b.name);
  });
}

function resolveCategoryIds(item: Square.CatalogObject.Item): string[] {
  const fromCategories = item.itemData?.categories
    ?.map((c: Square.CatalogObjectCategory) => c.id)
    .filter((id): id is string => Boolean(id));

  if (fromCategories && fromCategories.length > 0) {
    return fromCategories;
  }

  const legacyId = item.itemData?.categoryId;
  return legacyId ? [legacyId] : [];
}

function mapVariations(item: Square.CatalogObject.Item): ItemVariationDto[] {
  const variations = item.itemData?.variations ?? [];

  return variations
    .filter(
      (v: Square.CatalogObject): v is Square.CatalogObject.ItemVariation =>
        v.type === "ITEM_VARIATION",
    )
    .filter((v: Square.CatalogObject.ItemVariation) => !v.isDeleted)
    .map((v: Square.CatalogObject.ItemVariation) => ({
      id: v.id,
      name: v.itemVariationData?.name ?? null,
      price: toMoney(v.itemVariationData?.priceMoney),
      ordinal: v.itemVariationData?.ordinal ?? null,
    }))
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
}

export function mapItem(
  item: Square.CatalogObject.Item,
  imageUrlMap: Map<string, string>,
): MenuItemDto | null {
  if (item.isDeleted || item.itemData?.isArchived) {
    return null;
  }

  const name = item.itemData?.name;
  if (!name) return null;

  const variations = mapVariations(item);
  const price = variations.find((v) => v.price != null)?.price ?? null;

  const imageId = item.imageId ?? item.itemData?.imageIds?.[0];
  const imageUrl = imageId ? (imageUrlMap.get(imageId) ?? null) : null;

  const description =
    item.itemData?.descriptionPlaintext ??
    item.itemData?.description ??
    null;

  return {
    id: item.id,
    name,
    description,
    imageUrl,
    categoryIds: resolveCategoryIds(item),
    price,
    variations,
  };
}

export function mapItems(
  objects: Square.CatalogObject[],
  imageUrlMap: Map<string, string>,
  locationId?: string,
): MenuItemDto[] {
  const items: MenuItemDto[] = [];

  for (const object of objects) {
    if (object.type !== "ITEM") continue;
    if (locationId && !isPresentAtLocation(presenceFields(object), locationId)) {
      continue;
    }

    const mapped = mapItem(object, imageUrlMap);
    if (mapped) items.push(mapped);
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function groupMenuByCategory(
  categories: CategoryDto[],
  items: MenuItemDto[],
): {
  categories: { category: CategoryDto; items: MenuItemDto[] }[];
  uncategorized: MenuItemDto[];
} {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const groups = new Map<string, MenuItemDto[]>();
  const uncategorized: MenuItemDto[] = [];

  for (const item of items) {
    const ids = item.categoryIds.filter((id) => categoryMap.has(id));

    if (ids.length === 0) {
      uncategorized.push(item);
      continue;
    }

    // An item can belong to multiple categories; list it under each visible category.
    for (const categoryId of ids) {
      const bucket = groups.get(categoryId) ?? [];
      bucket.push(item);
      groups.set(categoryId, bucket);
    }
  }

  const grouped = categories
    .map((category) => ({
      category,
      items: groups.get(category.id) ?? [],
    }))
    .filter((group) => group.items.length > 0);

  return { categories: grouped, uncategorized };
}
