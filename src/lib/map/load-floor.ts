import { prisma } from "@/lib/db";
import { parseFloorMap, type FloorMap } from "./schema";

/** Load a single floor's geometry by floor id, parsed and validated. */
export async function loadFloorMapById(floorId: string): Promise<FloorMap | null> {
  const row = await prisma.floor.findUnique({ where: { id: floorId } });
  if (!row) return null;
  return parseFloorMap(JSON.parse(row.data));
}

/** Load all floors of a building, parsed and validated. */
export async function loadBuildingFloorMaps(buildingId: string): Promise<FloorMap[]> {
  const rows = await prisma.floor.findMany({
    where: { buildingId },
    orderBy: { level: "asc" },
  });
  return rows.map((r) => parseFloorMap(JSON.parse(r.data)));
}
