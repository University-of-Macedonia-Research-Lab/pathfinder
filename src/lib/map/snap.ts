/**
 * Snap helpers for the editor. Each function returns a snapped point and a
 * label so the canvas can show which snap fired. Application order in the
 * canvas: endpoint > intersection > ortho > grid (most specific wins).
 */
import type { FloorMap, Point } from "./schema";

export type SnapResult = {
  point: Point;
  kind: "grid" | "endpoint" | "ortho" | "intersection" | null;
};

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function snapToGrid(p: Point, step: number): Point {
  return {
    x: Math.round(p.x / step) * step,
    y: Math.round(p.y / step) * step,
  };
}

/** Collect every endpoint that's useful as a snap target. */
export function collectEndpoints(
  map: FloorMap,
  excludeIds?: { wallIds?: Set<string> },
): Point[] {
  const out: Point[] = [];
  for (const w of map.walls) {
    if (excludeIds?.wallIds?.has(w.id)) continue;
    out.push(w.start, w.end);
  }
  for (const d of map.doors) out.push(d.position);
  for (const r of map.rooms) for (const v of r.polygon) out.push(v);
  for (const n of map.nodes) out.push(n.position);
  return out;
}

export function snapToNearestEndpoint(
  p: Point,
  candidates: Point[],
  threshold: number,
): Point | null {
  let best: Point | null = null;
  let bestD = threshold;
  for (const c of candidates) {
    const d = dist(c, p);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Project p onto the 8-direction ortho lattice (0°, 45°, 90°, …) anchored
 *  at `anchor`. The result keeps the radial distance from anchor. */
export function snapOrtho(anchor: Point, p: Point): Point {
  const dx = p.x - anchor.x;
  const dy = p.y - anchor.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return p;
  const angle = Math.atan2(dy, dx);
  const step = Math.PI / 4;
  const snapAngle = Math.round(angle / step) * step;
  return {
    x: anchor.x + Math.cos(snapAngle) * len,
    y: anchor.y + Math.sin(snapAngle) * len,
  };
}

/** Intersection of segments (p1, p2) and (p3, p4) inside both segments, or null. */
export function segIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): Point | null {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  const u =
    -(((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom);
  if (t < -0.001 || t > 1.001 || u < -0.001 || u > 1.001) return null;
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
}

/** Find the closest intersection of the preview segment (anchor → p) with
 *  any wall in the map. Returns the intersection point if it's within
 *  `threshold` of `p`, otherwise null. */
export function snapToIntersection(
  anchor: Point,
  p: Point,
  walls: { start: Point; end: Point }[],
  threshold: number,
): Point | null {
  let best: Point | null = null;
  let bestD = threshold;
  for (const w of walls) {
    const x = segIntersection(anchor, p, w.start, w.end);
    if (!x) continue;
    const d = dist(x, p);
    if (d < bestD) {
      bestD = d;
      best = x;
    }
  }
  return best;
}
