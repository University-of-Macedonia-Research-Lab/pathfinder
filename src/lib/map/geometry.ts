import type { Point } from "./schema";

/** Ray-casting point-in-polygon. Polygon is a closed loop (first point
 *  not repeated). Returns true when `p` is strictly inside or on a vertex.
 *  Walks each edge and counts how many times a horizontal ray from `p`
 *  crosses it; odd = inside. */
export function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Find the first room polygon that contains `p`, or null if none. */
export function findContainingRoomId(
  p: Point,
  rooms: { id: string; polygon: Point[] }[],
): string | null {
  for (const r of rooms) {
    if (pointInPolygon(p, r.polygon)) return r.id;
  }
  return null;
}
