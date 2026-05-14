import type { Point } from "@/lib/map/schema";

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
