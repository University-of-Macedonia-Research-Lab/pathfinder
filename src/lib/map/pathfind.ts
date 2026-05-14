/**
 * A* pathfinding over a FloorMap's routing graph, with per-profile edge
 * weights so the same graph yields different routes for different users.
 *
 * The teaching shape is intentional: edge cost is `baseCost × multiplier`,
 * where the multiplier is the *worst* feature on the edge for the chosen
 * profile (Infinity = impassable). The heuristic is plain euclidean
 * distance to the goal, which is admissible because every edge cost is
 * ≥ its euclidean length.
 */
import type { AccessibilityFeature, FloorMap, GraphNode } from "./schema";

export type Profile = {
  id: string;
  label: string;
  /** Localised label for Greek UIs. */
  labelEl: string;
  /** Multipliers per feature; missing features default to 1. Infinity blocks. */
  weights: Partial<Record<AccessibilityFeature, number>>;
};

export const PROFILES: Record<string, Profile> = {
  default: {
    id: "default",
    label: "Default",
    labelEl: "Προεπιλογή",
    weights: {},
  },
  wheelchair: {
    id: "wheelchair",
    label: "Wheelchair",
    labelEl: "Αμαξίδιο",
    weights: {
      stairs: Infinity,
      step: Infinity,
      narrow_passage: 3,
      ramp: 1.1,
      elevator: 1.2,
    },
  },
  visually_impaired: {
    id: "visually_impaired",
    label: "Visually impaired",
    labelEl: "Άτομο με προβλήματα όρασης",
    weights: {
      stairs: 1.5,
      narrow_passage: 1.5,
    },
  },
};

export type PathResult = {
  nodes: string[];
  cost: number;
};

function euclid(a: GraphNode, b: GraphNode): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  return Math.sqrt(dx * dx + dy * dy);
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

type Adj = Map<string, { to: string; cost: number }[]>;

function buildAdjacency(map: FloorMap, profile: Profile): Adj {
  const nodesById = new Map(map.nodes.map((n) => [n.id, n]));
  const adj: Adj = new Map();
  for (const n of map.nodes) adj.set(n.id, []);

  for (const e of map.edges) {
    const a = nodesById.get(e.from);
    const b = nodesById.get(e.to);
    if (!a || !b) continue;
    const mult = edgeMultiplier(e.features, profile);
    if (!Number.isFinite(mult)) continue;
    const base = e.cost ?? euclid(a, b);
    const cost = base * mult;
    adj.get(e.from)!.push({ to: e.to, cost });
    adj.get(e.to)!.push({ to: e.from, cost });
  }
  return adj;
}

/** Find the lowest-cost path between two node ids. Returns null if unreachable. */
export function findPath(
  map: FloorMap,
  fromNodeId: string,
  toNodeId: string,
  profile: Profile = PROFILES.default,
): PathResult | null {
  const nodesById = new Map(map.nodes.map((n) => [n.id, n]));
  const start = nodesById.get(fromNodeId);
  const goal = nodesById.get(toNodeId);
  if (!start || !goal) return null;
  if (fromNodeId === toNodeId) return { nodes: [fromNodeId], cost: 0 };

  const adj = buildAdjacency(map, profile);
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const open = new Set<string>([fromNodeId]);
  gScore.set(fromNodeId, 0);

  // Tiny PQ: linear scan over `open`. Fine for teaching graphs (≤ ~10⁴ nodes).
  while (open.size > 0) {
    let current: string | null = null;
    let bestF = Infinity;
    for (const id of open) {
      const g = gScore.get(id) ?? Infinity;
      const node = nodesById.get(id)!;
      const f = g + euclid(node, goal);
      if (f < bestF) {
        bestF = f;
        current = id;
      }
    }
    if (current === null) break;
    if (current === toNodeId) {
      const nodes: string[] = [current];
      let c = current;
      while (cameFrom.has(c)) {
        c = cameFrom.get(c)!;
        nodes.unshift(c);
      }
      return { nodes, cost: gScore.get(current) ?? 0 };
    }
    open.delete(current);
    const currentG = gScore.get(current) ?? Infinity;
    for (const { to, cost } of adj.get(current) ?? []) {
      const tentative = currentG + cost;
      if (tentative < (gScore.get(to) ?? Infinity)) {
        cameFrom.set(to, current);
        gScore.set(to, tentative);
        open.add(to);
      }
    }
  }
  return null;
}

/** Resolve a room id to its representative graph node (first node tagged with that room). */
export function nodeForRoom(map: FloorMap, roomId: string): string | null {
  const n = map.nodes.find((n) => n.roomId === roomId);
  return n ? n.id : null;
}

/** Convenience: route between two rooms. */
export function findRouteBetweenRooms(
  map: FloorMap,
  fromRoomId: string,
  toRoomId: string,
  profile: Profile = PROFILES.default,
): PathResult | null {
  const a = nodeForRoom(map, fromRoomId);
  const b = nodeForRoom(map, toRoomId);
  if (!a || !b) return null;
  return findPath(map, a, b, profile);
}
