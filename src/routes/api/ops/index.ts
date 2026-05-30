/**
 * Reserved for future ops-only routes that should not follow method-based auth.
 * Mutating routes on v1 already require API_REFRESH_TOKEN via the auth plugin.
 */
export async function opsRoutes(): Promise<void> {
  return;
}
