import { z } from "zod";
import { config as loadDotenv } from "dotenv";

loadDotenv();

const authEnvSchema = z.object({
  API_GENERAL_TOKEN: z.string().min(16, "API_GENERAL_TOKEN must be at least 16 characters"),
  /** Optional — when set, POST/PUT/PATCH/DELETE require this instead of API_GENERAL_TOKEN. */
  API_REFRESH_TOKEN: z
    .string()
    .min(16, "API_REFRESH_TOKEN must be at least 16 characters")
    .optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

function parseAuthEnv(): AuthEnv {
  const result = authEnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error("Invalid auth environment configuration:", formatted);
    process.exit(1);
  }

  return result.data;
}

export const authEnv = parseAuthEnv();

export function isRefreshTokenEnabled(): boolean {
  return Boolean(authEnv.API_REFRESH_TOKEN);
}
