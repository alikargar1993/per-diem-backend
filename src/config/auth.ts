import { z } from "zod";
import { config as loadDotenv } from "dotenv";

loadDotenv();

const authEnvSchema = z.object({
  API_GENERAL_TOKEN: z.string().min(16, "API_GENERAL_TOKEN must be at least 16 characters"),
  API_REFRESH_TOKEN: z.string().min(16, "API_REFRESH_TOKEN must be at least 16 characters"),
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
