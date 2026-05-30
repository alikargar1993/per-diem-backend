import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const envSchema = z.object({
  SQUARE_ACCESS_TOKEN: z.string().min(1, "SQUARE_ACCESS_TOKEN is required"),
  SQUARE_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error("Invalid environment configuration:", formatted);
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
