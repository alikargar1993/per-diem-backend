import { SquareClient, SquareEnvironment } from "square";
import { env } from "../../config/env.js";

let client: SquareClient | undefined;

/**
 * Single Square client for the process lifetime.
 * Tokens never leave the server — the frontend only talks to our API.
 */
export function getSquareClient(): SquareClient {
  if (!client) {
    const environment =
      env.SQUARE_ENVIRONMENT === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox;

    client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment,
    });
  }

  return client;
}
