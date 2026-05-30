/**
 * Square location presence rules (CatalogObjectBase):
 * - presentAtAllLocations defaults to true → everywhere except absentAtLocationIds
 * - presentAtAllLocations false → only presentAtLocationIds
 */
export type LocationPresenceFields = {
  presentAtAllLocations?: boolean;
  presentAtLocationIds?: string[];
  absentAtLocationIds?: string[];
};

export function isPresentAtLocation(
  object: LocationPresenceFields,
  locationId: string,
): boolean {
  const atAllLocations = object.presentAtAllLocations ?? true;
  const presentIds = object.presentAtLocationIds ?? [];
  const absentIds = object.absentAtLocationIds ?? [];

  if (atAllLocations) {
    return !absentIds.includes(locationId);
  }

  return presentIds.includes(locationId);
}
