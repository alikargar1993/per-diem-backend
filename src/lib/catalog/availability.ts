import type { Square } from "square";
import {
  availabilityAttributeName,
  dayAvailabilityAttributeName,
  isWeekday,
  isWeekend,
  mealPeriodSelectionUids,
  mealPeriodWindows,
  weekdaySelectionUid,
  weekendSelectionUid,
  type DayOfWeek,
  type MealPeriod,
} from "../../config/availability.js";

export type AvailabilityContext = {
  referenceTime: Date;
  /** IANA timezone used to resolve local time-of-day and day-of-week. */
  timezone: string;
  activePeriods: MealPeriod[];
  activeSelectionUids: string[];
  activeDay: DayOfWeek;
  /** Square "AvailableDays" selection UIDs that match the current local day. */
  activeDaySelectionUids: string[];
};

/** Server machine local timezone (Node / OS). */
export function getMachineTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function resolveTimezone(locationTimezone: string | null): string {
  if (!locationTimezone) return "UTC";

  try {
    Intl.DateTimeFormat(undefined, { timeZone: locationTimezone });
    return locationTimezone;
  } catch {
    return "UTC";
  }
}

/** Wall-clock hour/minute for `instant` in `timezone`. */
export function getLocalMinutes(instant: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(instant);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return hour * 60 + minute;
}

const DAY_INDEX_TO_KEY: DayOfWeek[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

/** Local day-of-week for `instant` in `timezone`. */
export function getLocalDayOfWeek(instant: Date, timezone: string): DayOfWeek {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });

  const weekday = formatter.format(instant).toLowerCase().slice(0, 3);
  const match = DAY_INDEX_TO_KEY.find((day) => day === weekday);

  if (match) return match;

  const utcDay = instant.getUTCDay();
  return DAY_INDEX_TO_KEY[utcDay] ?? "sun";
}

export function getActiveMealPeriods(localMinutes: number): MealPeriod[] {
  const active: MealPeriod[] = [];

  for (const period of Object.keys(mealPeriodWindows) as MealPeriod[]) {
    const { startMinutes, endMinutes } = mealPeriodWindows[period];
    if (localMinutes >= startMinutes && localMinutes < endMinutes) {
      active.push(period);
    }
  }

  return active;
}

/** Selection UIDs on "AvailableDays" that match the given local day. */
export function getActiveDaySelectionUids(localDay: DayOfWeek): string[] {
  const uids: string[] = [];

  if (isWeekday(localDay) && weekdaySelectionUid) {
    uids.push(weekdaySelectionUid);
  }

  if (isWeekend(localDay) && weekendSelectionUid) {
    uids.push(weekendSelectionUid);
  }

  return uids;
}

export function buildAvailabilityContext(
  referenceTime: Date,
  timezone: string,
): AvailabilityContext {
  const resolvedTimezone = resolveTimezone(timezone);
  const localMinutes = getLocalMinutes(referenceTime, resolvedTimezone);
  const activeDay = getLocalDayOfWeek(referenceTime, resolvedTimezone);
  const activePeriods = getActiveMealPeriods(localMinutes);
  const activeSelectionUids = activePeriods.map(
    (period) => mealPeriodSelectionUids[period],
  );
  const activeDaySelectionUids = getActiveDaySelectionUids(activeDay);

  return {
    referenceTime,
    timezone: resolvedTimezone,
    activePeriods,
    activeSelectionUids,
    activeDay,
    activeDaySelectionUids,
  };
}

/** Client `at` uses location TZ; omitted `at` uses server machine local time. */
export function buildAvailabilityContextForMenu(
  at: Date | undefined,
  locationTimezone: string | null,
): AvailabilityContext {
  const referenceTime = at ?? new Date();
  const timezone = at != null ? resolveTimezone(locationTimezone) : getMachineTimezone();
  return buildAvailabilityContext(referenceTime, timezone);
}

/**
 * Reads Square's "Availability" SELECTION attribute on a variation.
 * Returns null when the variation has no meal-period restriction (always orderable).
 */
export function getVariationAvailabilityUids(
  variation: Square.CatalogObject.ItemVariation,
): string[] | null {
  const values = variation.customAttributeValues;
  if (!values) return null;

  for (const attribute of Object.values(values)) {
    if (
      attribute.name === availabilityAttributeName &&
      attribute.type === "SELECTION"
    ) {
      return attribute.selectionUidValues ?? [];
    }
  }

  return null;
}

/**
 * Reads Square's "AvailableDays" SELECTION attribute on a variation.
 * Returns null when the variation has no day-of-week restriction.
 */
export function getVariationDayUids(
  variation: Square.CatalogObject.ItemVariation,
): string[] | null {
  const values = variation.customAttributeValues;
  if (!values) return null;

  for (const attribute of Object.values(values)) {
    if (
      attribute.name === dayAvailabilityAttributeName &&
      attribute.type === "SELECTION"
    ) {
      return attribute.selectionUidValues ?? [];
    }
  }

  return null;
}

export function isVariationAvailableForMeal(
  variation: Square.CatalogObject.ItemVariation,
  context: AvailabilityContext,
): boolean {
  const allowedUids = getVariationAvailabilityUids(variation);

  if (allowedUids == null || allowedUids.length === 0) {
    return true;
  }

  if (context.activeSelectionUids.length === 0) {
    return false;
  }

  return allowedUids.some((uid) => context.activeSelectionUids.includes(uid));
}

export function isVariationAvailableOnDay(
  variation: Square.CatalogObject.ItemVariation,
  context: AvailabilityContext,
): boolean {
  const allowedUids = getVariationDayUids(variation);

  if (allowedUids == null || allowedUids.length === 0) {
    return true;
  }

  if (context.activeDaySelectionUids.length === 0) {
    return false;
  }

  return allowedUids.some((uid) =>
    context.activeDaySelectionUids.includes(uid),
  );
}

/** Variation is orderable now when meal-period and day-of-week rules both pass. */
export function isVariationAvailableNow(
  variation: Square.CatalogObject.ItemVariation,
  context: AvailabilityContext,
): boolean {
  return (
    isVariationAvailableForMeal(variation, context) &&
    isVariationAvailableOnDay(variation, context)
  );
}

export function isItemAvailableNow(
  item: Square.CatalogObject.Item,
  context: AvailabilityContext,
): boolean {
  const variations = item.itemData?.variations ?? [];

  return variations.some(
    (v) =>
      v.type === "ITEM_VARIATION" &&
      !v.isDeleted &&
      isVariationAvailableNow(v, context),
  );
}
