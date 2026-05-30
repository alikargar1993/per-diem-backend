export type MoneyDto = {
  /** Amount in the smallest currency unit (e.g. cents). */
  amount: number;
  currency: string;
};

export type LocationDto = {
  id: string;
  name: string | null;
  status: string | null;
  timezone: string | null;
  addressLine1: string | null;
  locality: string | null;
};

export type CategoryDto = {
  id: string;
  name: string;
  ordinal: number | null;
};

export type ItemVariationDto = {
  id: string;
  name: string | null;
  price: MoneyDto | null;
  ordinal: number | null;
};

export type MenuItemDto = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryIds: string[];
  /** Primary display price (first variation with a fixed price). */
  price: MoneyDto | null;
  variations: ItemVariationDto[];
};

export type MenuCategoryGroupDto = {
  category: CategoryDto;
  items: MenuItemDto[];
};

export type MenuAvailabilityDto = {
  /** ISO 8601 instant used for filtering (from client `at` or server now). */
  referenceTime: string;
  /** IANA timezone used to resolve meal periods (location timezone). */
  timezone: string;
  /** Active meal periods at referenceTime in timezone (empty = late-night gap). */
  activePeriods: ("breakfast" | "lunch" | "dinner")[];
};

export type MenuResponseDto = {
  locationId: string;
  availability: MenuAvailabilityDto;
  categories: MenuCategoryGroupDto[];
  /** Items with no resolvable category, if any. */
  uncategorized: MenuItemDto[];
};

export type CatalogResponseDto = {
  categories: CategoryDto[];
  items: MenuItemDto[];
};
