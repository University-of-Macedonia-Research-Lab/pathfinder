/**
 * AccessMap floor schema.
 *
 * A floor is described as data, not a hand-drawn SVG: rooms are polygons in
 * a flat 2D coordinate space, doors connect rooms to corridors, and a
 * routing graph (nodes + edges) lives alongside the geometry. The renderer
 * walks this structure to produce SVG; the pathfinder walks the graph.
 *
 * Coordinates are unitless. Pick any consistent scale per floor (e.g.
 * "1 unit = 0.1m"). The viewBox is derived from `bounds`.
 */
import { z } from "zod";

export const Point = z.object({
  x: z.number(),
  y: z.number(),
});
export type Point = z.infer<typeof Point>;

const Bilingual = z.object({
  en: z.string(),
  el: z.string(),
});
export type Bilingual = z.infer<typeof Bilingual>;

/** Why a node/edge matters for accessibility. Used by the renderer for icons
 *  and by the pathfinder for per-profile cost weights. */
export const AccessibilityFeature = z.enum([
  "elevator",
  "stairs",
  "ramp",
  "wheelchair_lift",
  "accessible_bathroom",
  "bathroom",
  "automatic_door",
  "narrow_passage",
  "step",
]);
export type AccessibilityFeature = z.infer<typeof AccessibilityFeature>;

export const RoomKind = z.enum([
  "classroom",
  "office",
  "lab",
  "lecture_hall",
  "bathroom",
  "stairwell",
  "elevator_shaft",
  "corridor",
  "entrance",
  "outdoor",
  "other",
]);
export type RoomKind = z.infer<typeof RoomKind>;

export const Room = z.object({
  id: z.string(),
  kind: RoomKind,
  name: Bilingual,
  /** Optional human code, e.g. "404", "ΙΣ16". Often used for search. */
  code: z.string().optional(),
  /** Polygon in floor coordinates. At least 3 points; closed implicitly. */
  polygon: z.array(Point).min(3),
});
export type Room = z.infer<typeof Room>;

/** A wall segment. Drawn as a thick stroke; `kind` controls the visual style.
 *  `window` segments render as a light cyan break instead of opaque ink. */
export const WallSegment = z.object({
  id: z.string(),
  start: Point,
  end: Point,
  kind: z.enum(["exterior", "interior", "window"]).default("interior"),
});
export type WallSegment = z.infer<typeof WallSegment>;

/** A door connects exactly two rooms (or a room and the outside). The
 *  position is a point on the shared wall; we don't model door swings. */
export const Door = z.object({
  id: z.string(),
  between: z.tuple([z.string(), z.string()]),
  position: Point,
  features: z.array(AccessibilityFeature).default([]),
});
export type Door = z.infer<typeof Door>;

/** A vertex in the routing graph. Usually inside a room or at a door. */
export const GraphNode = z.object({
  id: z.string(),
  position: Point,
  /** The room the node sits in; used to map "go to room X" to a node. */
  roomId: z.string().optional(),
  /** Floor-changers (stairs/elevator) link to a node on another floor. */
  connectsToFloor: z
    .object({
      floorSlug: z.string(),
      nodeId: z.string(),
    })
    .optional(),
  features: z.array(AccessibilityFeature).default([]),
});
export type GraphNode = z.infer<typeof GraphNode>;

/** Undirected edge by default. The pathfinder applies per-profile multipliers
 *  based on `features` (e.g. "stairs" → infinity for the wheelchair profile). */
export const GraphEdge = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  /** Base cost. If omitted, falls back to euclidean distance between nodes. */
  cost: z.number().positive().optional(),
  features: z.array(AccessibilityFeature).default([]),
});
export type GraphEdge = z.infer<typeof GraphEdge>;

export const FloorMap = z.object({
  schemaVersion: z.literal(1),
  buildingSlug: z.string(),
  floorSlug: z.string(),
  level: z.number().int(),
  name: Bilingual,
  /** Bounding box of the drawing, used as the SVG viewBox. */
  bounds: z.object({
    minX: z.number(),
    minY: z.number(),
    maxX: z.number(),
    maxY: z.number(),
  }),
  /** Optional polygon describing the building's exterior boundary on this
   *  floor. When present, it's drawn as a filled "floor base" with a thick
   *  exterior wall stroke around its edges. */
  outline: z.array(Point).min(3).optional(),
  /** Interior partitions and window cutouts. Wall segments are drawn over
   *  the rooms; window segments use the lighter "glass" style. */
  walls: z.array(WallSegment).default([]),
  rooms: z.array(Room),
  doors: z.array(Door).default([]),
  nodes: z.array(GraphNode),
  edges: z.array(GraphEdge),
});
export type FloorMap = z.infer<typeof FloorMap>;

export function parseFloorMap(input: unknown): FloorMap {
  return FloorMap.parse(input);
}
