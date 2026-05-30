import { z } from "zod";
import { config as loadDotenv } from "dotenv";

loadDotenv();

/**
 * Square selection UIDs for the "Availability" custom attribute on item variations.
 * Override in .env when seeding a different sandbox catalog.
 */
const selectionUidSchema = z.object({
  AVAILABILITY_BREAKFAST_UID: z
    .string()
    .default("PKBXXUADKOITWIVJTD4LSBLR"),
  AVAILABILITY_LUNCH_UID: z.string().default("TRGLV5CWEK5VNG3XBSHANNDS"),
  AVAILABILITY_DINNER_UID: z.string().default("ZHS3JFOZBNFKY3TJGXNULMTP"),
});

const parsed = selectionUidSchema.parse(process.env);

export type MealPeriod = "breakfast" | "lunch" | "dinner";

export const mealPeriodSelectionUids: Record<MealPeriod, string> = {
  breakfast: parsed.AVAILABILITY_BREAKFAST_UID,
  lunch: parsed.AVAILABILITY_LUNCH_UID,
  dinner: parsed.AVAILABILITY_DINNER_UID,
};

/** Local wall-clock windows (start inclusive, end exclusive) for each meal period. */
export const mealPeriodWindows: Record<
  MealPeriod,
  { startMinutes: number; endMinutes: number }
> = {
  breakfast: { startMinutes: 5 * 60, endMinutes: 11 * 60 },
  lunch: { startMinutes: 11 * 60, endMinutes: 15 * 60 },
  dinner: { startMinutes: 15 * 60, endMinutes: 22 * 60 },
};

export const availabilityAttributeName = "Availability";
