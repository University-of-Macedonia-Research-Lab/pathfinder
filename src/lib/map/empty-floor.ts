import type { FloorMap } from "./schema";

/**
 * Factory for a blank floor. Used when a user creates a new floor —
 * gives them a sensible empty canvas (200×200 units, no rooms/nodes)
 * to start editing in.
 */
export function emptyFloor(args: {
  buildingSlug: string;
  floorSlug: string;
  level: number;
  nameEn: string;
  nameEl: string;
}): FloorMap {
  return {
    schemaVersion: 1,
    buildingSlug: args.buildingSlug,
    floorSlug: args.floorSlug,
    level: args.level,
    name: { en: args.nameEn, el: args.nameEl },
    bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200 },
    outline: undefined,
    walls: [],
    rooms: [],
    doors: [],
    nodes: [],
    edges: [],
  };
}
