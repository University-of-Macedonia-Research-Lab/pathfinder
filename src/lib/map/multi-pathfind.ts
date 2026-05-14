/**
 * Multi-floor routing.
 *
 * Builds a single graph from every floor of a building, where each node id
 * is namespaced as `${floorSlug}:${nodeId}`. A node's `connectsToFloor`
 * field becomes a cross-floor edge whose features are inherited from the
 * source node, so a `stairs` transition is blocked for the wheelchair
 * profile exactly the same way an in-floor `stairs` edge would be.
 *
 * Heuristic is 0 (Dijkstra) since A*'s euclidean heuristic doesn't
 * generalise across floors. Floor-plan-sized graphs are tiny, Dijkstra
 * is plenty fast and the implementation stays single-page.
 */
import type { AccessibilityFeature, FloorMap, GraphNode } from "./schema";
import { PROFILES, type Profile } from "./pathfind";

export type MultiFloorRef = { floor: string; node: string };

export type MultiFloorPath = {
  /** Total cost summed across all per-floor segments and cross-floor hops. */
  cost: number;
  /** Path grouped by floor, consecutive same-floor nodes form a segment.
   *  Adjacent segments mean a cross-floor transition between them. */
  segments: Array<{ floorSlug: string; nodes: string[] }>;
};

/** Cost added to each cross-floor traversal. Acts as a base "it takes time
 *  to wait for an elevator / climb stairs" overhead before the per-profile
 *  multiplier is applied. */
const FLOOR_CHANGE_BASE_COST = 5;

function key(floorSlug: string, nodeId: string): string {
  return `${floorSlug}::${nodeId}`;
}

function unkey(k: string): { floor: string; node: string } {
  const i = k.indexOf("::");
  return { floor: k.slice(0, i), node: k.slice(i + 2) };
}

function edgeMultiplier(
  features: AccessibilityFeature[],
  profile: Profile,
): number {
  let m = 1;
  for (const f of features) {
    const w = profile.weights[f];
    if (w === undefined) continue;
    if (w === Infinity) return Infinity;
    if (w > m) m = w;
  }
  return m;
}

function euclid(a: GraphNode, b: GraphNode): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}

type Adj = Map<string, { to: string; cost: number }[]>;

function buildUnifiedAdjacency(floors: FloorMap[], profile: Profile): Adj {
  const adj: Adj = new Map();
  const nodesByKey = new Map<string, GraphNode>();
  for (const floor of floors) {
    for (const n of floor.nodes) {
      const k = key(floor.floorSlug, n.id);
      adj.set(k, []);
      nodesByKey.set(k, n);
    }
  }

  for (const floor of floors) {
    // Intra-floor edges (undirected).
    for (const e of floor.edges) {
      const fromK = key(floor.floorSlug, e.from);
      const toK = key(floor.floorSlug, e.to);
      const a = nodesByKey.get(fromK);
      const b = nodesByKey.get(toK);
      if (!a || !b) continue;
      const mult = edgeMultiplier(e.features, profile);
      if (!Number.isFinite(mult)) continue;
      const base = e.cost ?? euclid(a, b);
      const cost = base * mult;
      adj.get(fromK)!.push({ to: toK, cost });
      adj.get(toK)!.push({ to: fromK, cost });
    }

    // Cross-floor edges. We add a directed edge from each side that declares
    // a `connectsToFloor`; if both sides declare it (the typical case),
    // that's bidirectional. If only one side declares it, traversal is
    // one-way, which is occasionally what you want (e.g. a fire exit).
    for (const n of floor.nodes) {
      if (!n.connectsToFloor) continue;
      const fromK = key(floor.floorSlug, n.id);
      const toK = key(n.connectsToFloor.floorSlug, n.connectsToFloor.nodeId);
      if (!adj.has(toK)) continue;
      const mult = edgeMultiplier(n.features, profile);
      if (!Number.isFinite(mult)) continue;
      adj.get(fromK)!.push({ to: toK, cost: FLOOR_CHANGE_BASE_COST * mult });
    }
  }

  return adj;
}

/** Lowest-cost path between two `(floor, node)` pairs across a building. */
export function findMultiFloorPath(
  floors: FloorMap[],
  from: MultiFloorRef,
  to: MultiFloorRef,
  profile: Profile = PROFILES.default,
): MultiFloorPath | null {
  const start = key(from.floor, from.node);
  const goal = key(to.floor, to.node);
  const adj = buildUnifiedAdjacency(floors, profile);
  if (!adj.has(start) || !adj.has(goal)) return null;
  if (start === goal) {
    return {
      cost: 0,
      segments: [{ floorSlug: from.floor, nodes: [from.node] }],
    };
  }

  // Dijkstra with a linear-scan priority queue. Fine for floor-plan graphs.
  const dist = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const open = new Set<string>([start]);
  dist.set(start, 0);

  while (open.size > 0) {
    let current: string | null = null;
    let bestD = Infinity;
    for (const k of open) {
      const d = dist.get(k) ?? Infinity;
      if (d < bestD) {
        bestD = d;
        current = k;
      }
    }
    if (current === null) break;
    if (current === goal) break;
    open.delete(current);
    const currentD = dist.get(current) ?? Infinity;
    for (const { to: next, cost } of adj.get(current) ?? []) {
      const tentative = currentD + cost;
      if (tentative < (dist.get(next) ?? Infinity)) {
        cameFrom.set(next, current);
        dist.set(next, tentative);
        open.add(next);
      }
    }
  }

  if (!dist.has(goal)) return null;

  // Reconstruct path of unified keys, then bucket into per-floor segments.
  const keys: string[] = [goal];
  let c = goal;
  while (cameFrom.has(c)) {
    c = cameFrom.get(c)!;
    keys.unshift(c);
  }
  const segments: MultiFloorPath["segments"] = [];
  for (const k of keys) {
    const { floor, node } = unkey(k);
    const last = segments[segments.length - 1];
    if (last && last.floorSlug === floor) last.nodes.push(node);
    else segments.push({ floorSlug: floor, nodes: [node] });
  }

  return { cost: dist.get(goal)!, segments };
}

/** Find the representative node for a (floor, room) pair. */
export function nodeForRoomOnFloor(
  floors: FloorMap[],
  floorSlug: string,
  roomId: string,
): MultiFloorRef | null {
  const floor = floors.find((f) => f.floorSlug === floorSlug);
  if (!floor) return null;
  const n = floor.nodes.find((n) => n.roomId === roomId);
  return n ? { floor: floorSlug, node: n.id } : null;
}

/** Convenience: route between two rooms identified by (floor, room). */
export function findMultiFloorRouteBetweenRooms(
  floors: FloorMap[],
  from: { floor: string; room: string },
  to: { floor: string; room: string },
  profile: Profile = PROFILES.default,
): MultiFloorPath | null {
  const a = nodeForRoomOnFloor(floors, from.floor, from.room);
  const b = nodeForRoomOnFloor(floors, to.floor, to.room);
  if (!a || !b) return null;
  return findMultiFloorPath(floors, a, b, profile);
}
