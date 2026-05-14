import type { Point, RoomKind } from "@/lib/map/schema";

export type Selected =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "wall"; id: string }
  | { kind: "door"; id: string }
  | { kind: "room"; id: string }
  | null;

/** A point in an in-progress graph polyline. `nodeId` is set when the point
 *  references an existing graph node (via endpoint snap or a direct click),
 *  so commit reuses that node instead of creating a duplicate. */
export type GraphPolyPoint = { point: Point; nodeId?: string };

export type Drawing =
  | { kind: "none" }
  | { kind: "wall"; points: Point[]; wallKind: "interior" | "exterior" | "window" }
  | { kind: "polygon"; points: Point[] }
  | { kind: "graphLine"; points: GraphPolyPoint[] };

/** Lightweight view of a sibling floor inside the same building, used by
 *  the node editor to pick a cross-floor link target (stairs/elevators)
 *  and to detect one-way links (where the reverse pointer is missing). */
export type SiblingFloor = {
  slug: string;
  level: number;
  nameEn: string;
  nodes: {
    id: string;
    position: Point;
    roomId?: string;
    connectsToFloor?: { floorSlug: string; nodeId: string };
  }[];
  rooms: { id: string; code?: string; nameEn: string; kind: RoomKind }[];
};

export type SnapMode = "grid" | "endpoint" | "ortho" | "intersection";

export type SnapState = {
  grid: boolean;
  endpoint: boolean;
  ortho: boolean;
  intersection: boolean;
};

export const DEFAULT_SNAP: SnapState = {
  grid: true,
  endpoint: true,
  ortho: true,
  intersection: true,
};
