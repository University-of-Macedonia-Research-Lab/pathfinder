/**
 * Graph topology helpers — connected-components analysis plus a "normalize"
 * pass that collapses near-duplicate nodes and adds bridge edges between
 * components that visually touch but aren't actually connected.
 *
 * Why this exists: the pathfinder treats the graph as one structure but
 * the editor doesn't enforce that during drawing. Two separate polylines
 * drawn near each other read as one graph to the user, but Dijkstra sees
 * disjoint islands and refuses to route between them.
 */
import type { FloorMap, GraphEdge, GraphNode, Point } from "./schema";

function dist2(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** Group node ids into connected components by walking the undirected
 *  edge graph. O(n + e). */
export function connectedComponents(
  nodes: GraphNode[],
  edges: GraphEdge[],
): string[][] {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.from)?.push(e.to);
    adj.get(e.to)?.push(e.from);
  }
  const visited = new Set<string>();
  const out: string[][] = [];
  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    const stack = [n.id];
    const comp: string[] = [];
    while (stack.length) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      comp.push(id);
      for (const next of adj.get(id) ?? []) {
        if (!visited.has(next)) stack.push(next);
      }
    }
    out.push(comp);
  }
  return out;
}

export type NormalizeResult = {
  map: FloorMap;
  mergedNodes: number;
  /** Edges that geometrically passed through an intermediate node and were
   *  split into a chain so each segment hops node-by-node. */
  splitEdges: number;
  /** Edges added inside the user-set distance threshold. */
  bridgesAdded: number;
  /** Edges added by `connectAll` to force the graph into one component,
   *  regardless of distance. Zero when `connectAll` was false. */
  forcedBridges: number;
  componentsBefore: number;
  componentsAfter: number;
};

const undirectedKey = (a: string, b: string): string =>
  a < b ? `${a}|${b}` : `${b}|${a}`;

const newEdgeId = (): string => `e-${Math.random().toString(36).slice(2, 8)}`;

/** Merge near-duplicate nodes and bridge close-but-disconnected components.
 *
 *  - `mergeThreshold`: any two nodes within this distance are collapsed
 *    into a single node. Edges are rewired to the survivor and self-loops /
 *    duplicate edges are pruned. The survivor keeps its roomId / features /
 *    connectsToFloor — handy for accidental double-clicks while drawing.
 *  - `bridgeThreshold`: after merge, for each node we find the nearest
 *    node in a *different* connected component; if the gap is within this
 *    threshold we add an undirected edge across. Greedy and idempotent. */
export function normalizeGraph(
  map: FloorMap,
  mergeThreshold: number,
  bridgeThreshold: number,
  options?: { connectAll?: boolean },
): NormalizeResult {
  const componentsBefore = connectedComponents(map.nodes, map.edges).length;

  // ── Step 1: merge near-duplicates ──────────────────────────────────────
  const canonical = new Map<string, string>(); // oldId → keptId
  const sorted = [...map.nodes].sort((a, b) => a.position.x - b.position.x);
  const threshSq = mergeThreshold * mergeThreshold;
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (canonical.has(a.id)) continue;
    canonical.set(a.id, a.id);
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (b.position.x - a.position.x > mergeThreshold) break;
      if (canonical.has(b.id)) continue;
      if (dist2(a.position, b.position) <= threshSq) {
        canonical.set(b.id, a.id);
      }
    }
  }
  let mergedNodes = 0;
  for (const [oldId, keptId] of canonical) if (oldId !== keptId) mergedNodes++;

  const kept = new Set(canonical.values());
  const nodes: GraphNode[] = map.nodes.filter((n) => kept.has(n.id));

  // Rewire edges, dropping self-loops and de-duplicating undirected pairs.
  const seenEdge = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const e of map.edges) {
    const from = canonical.get(e.from) ?? e.from;
    const to = canonical.get(e.to) ?? e.to;
    if (from === to) continue;
    const key = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    edges.push({ ...e, from, to });
  }

  // ── Step 2: split edges that pass through intermediate nodes ──────────
  //
  // An edge A-C whose segment goes (within `splitTolerance`) through some
  // other node B is visually wrong — Dijkstra picks A-C because it's
  // shorter than A-B+B-C, and the route skips B. We re-chain A-B-C in
  // that case, deduplicating against any edges that already exist.
  const splitTolerance = Math.max(0.5, mergeThreshold * 2);
  const existingEdgeKeys = new Set(
    edges.map((e) => undirectedKey(e.from, e.to)),
  );
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const splitOutput: GraphEdge[] = [];
  let splitEdges = 0;
  const tolSq = splitTolerance * splitTolerance;

  for (const e of edges) {
    const u = nodesById.get(e.from);
    const v = nodesById.get(e.to);
    if (!u || !v) {
      splitOutput.push(e);
      continue;
    }
    const dx = v.position.x - u.position.x;
    const dy = v.position.y - u.position.y;
    const segLenSq = dx * dx + dy * dy;
    if (segLenSq < 1e-9) {
      splitOutput.push(e);
      continue;
    }
    // Find every node whose projection lies strictly inside (u,v) AND
    // whose perpendicular distance is below tolerance.
    const intermediates: { node: GraphNode; t: number }[] = [];
    for (const w of nodes) {
      if (w.id === e.from || w.id === e.to) continue;
      const wx = w.position.x - u.position.x;
      const wy = w.position.y - u.position.y;
      const t = (wx * dx + wy * dy) / segLenSq;
      if (t <= 1e-6 || t >= 1 - 1e-6) continue;
      const footX = u.position.x + t * dx;
      const footY = u.position.y + t * dy;
      const px = w.position.x - footX;
      const py = w.position.y - footY;
      if (px * px + py * py <= tolSq) intermediates.push({ node: w, t });
    }
    if (intermediates.length === 0) {
      splitOutput.push(e);
      continue;
    }
    // Chain u → sorted intermediates → v; emit each missing hop.
    intermediates.sort((a, b) => a.t - b.t);
    const chain = [u, ...intermediates.map((i) => i.node), v];
    // Drop the original — it gets replaced by the chain.
    existingEdgeKeys.delete(undirectedKey(e.from, e.to));
    splitEdges++;
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      const k = undirectedKey(a.id, b.id);
      if (existingEdgeKeys.has(k)) continue;
      existingEdgeKeys.add(k);
      splitOutput.push({
        id: newEdgeId(),
        from: a.id,
        to: b.id,
        // Inherit features from the original edge — if the spanning edge
        // was tagged `stairs`, the sub-segments should be too.
        features: [...e.features],
      });
    }
  }
  // Reassemble: keep only edges whose key still exists. (Splits removed
  // their original via existingEdgeKeys.delete; new chain edges were
  // appended to splitOutput along the way.)
  const edgesAfterSplit: GraphEdge[] = [];
  const seenAfterSplit = new Set<string>();
  for (const e of splitOutput) {
    const k = undirectedKey(e.from, e.to);
    if (!existingEdgeKeys.has(k)) continue;
    if (seenAfterSplit.has(k)) continue;
    seenAfterSplit.add(k);
    edgesAfterSplit.push(e);
  }
  edges.length = 0;
  edges.push(...edgesAfterSplit);

  // ── Step 3: bridge close-but-disconnected components ───────────────────
  let bridgesAdded = 0;
  if (bridgeThreshold > 0) {
    let comps = connectedComponents(nodes, edges);
    const compIdx = new Map<string, number>();
    for (let i = 0; i < comps.length; i++) {
      for (const id of comps[i]) compIdx.set(id, i);
    }
    // Union-find for component merging as we add bridges, so we don't add
    // multiple bridges between the same pair of components.
    const parent = new Map<number, number>();
    for (let i = 0; i < comps.length; i++) parent.set(i, i);
    const find = (i: number): number => {
      let r = i;
      while (parent.get(r)! !== r) r = parent.get(r)!;
      while (parent.get(i)! !== r) {
        const next = parent.get(i)!;
        parent.set(i, r);
        i = next;
      }
      return r;
    };
    const union = (a: number, b: number) => parent.set(find(a), find(b));

    const bridgeSq = bridgeThreshold * bridgeThreshold;
    // For each node, find its nearest cross-component neighbour; if within
    // threshold, add a bridge edge. Linear scan is fine for floor-plan
    // graphs (≤ a few thousand nodes).
    for (const a of nodes) {
      const aComp = compIdx.get(a.id)!;
      let best: { node: GraphNode; d2: number } | null = null;
      for (const b of nodes) {
        if (a.id === b.id) continue;
        const bComp = compIdx.get(b.id)!;
        if (find(aComp) === find(bComp)) continue;
        const d2v = dist2(a.position, b.position);
        if (d2v <= bridgeSq && (!best || d2v < best.d2)) {
          best = { node: b, d2: d2v };
        }
      }
      if (best) {
        edges.push({
          id: newEdgeId(),
          from: a.id,
          to: best.node.id,
          features: [],
        });
        union(aComp, compIdx.get(best.node.id)!);
        bridgesAdded++;
      }
    }
  }

  // ── Step 4: force-connect any remaining components ────────────────────
  // MST-style: while we still have more than one component, find the
  // pair of nodes (from different components) with the smallest gap,
  // bridge them, and repeat. Guarantees a single connected graph.
  let forcedBridges = 0;
  if (options?.connectAll) {
    while (true) {
      const comps = connectedComponents(nodes, edges);
      if (comps.length <= 1) break;
      const compIdx = new Map<string, number>();
      for (let i = 0; i < comps.length; i++) {
        for (const id of comps[i]) compIdx.set(id, i);
      }
      let best: { aId: string; bId: string; d2: number } | null = null;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const aComp = compIdx.get(a.id);
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const bComp = compIdx.get(b.id);
          if (aComp === bComp) continue;
          const d2v = dist2(a.position, b.position);
          if (!best || d2v < best.d2) {
            best = { aId: a.id, bId: b.id, d2: d2v };
          }
        }
      }
      if (!best) break;
      edges.push({
        id: newEdgeId(),
        from: best.aId,
        to: best.bId,
        features: [],
      });
      forcedBridges++;
    }
  }

  const componentsAfter = connectedComponents(nodes, edges).length;

  return {
    map: { ...map, nodes, edges },
    mergedNodes,
    splitEdges,
    bridgesAdded,
    forcedBridges,
    componentsBefore,
    componentsAfter,
  };
}
