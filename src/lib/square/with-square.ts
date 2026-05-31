import { mapSquareError } from "./map-square-error.js";

/** Runs a Square SDK call and maps failures to AppError. */
export async function withSquare<T>(
  context: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw mapSquareError(error, context);
  }
}
