/**
 * Turn-by-turn directions for an AccessMap multi-floor route.
 *
 * Walks the path one node at a time, accumulates distance between
 * "decision points" (junctions that turn, floor-changers, the
 * destination), classifies the turn at each junction by the signed
 * angle between the incoming and outgoing edge, and emits one step per
 * decision. The result is a flat list of typed steps that the UI can
 * render directly.
 *
 * Distance unit: the schema uses unitless coordinates with the
 * convention "1 unit ≈ 0.1 m" (documented in the home page's "How to
 * draw a map" section). All distances in steps are reported in metres
 * and rounded to the nearest integer (with a 1 m floor so we never
 * emit "0 m").
 */
import type { FloorMap, GraphNode, Point } from "./schema";
import type { MultiFloorPath } from "./multi-pathfind";

export type DirectionsLang = "en" | "el";

export type Step =
  | {
      kind: "start";
      text: string;
      floorSlug: string;
      nodeId: string;
    }
  | {
      kind: "continue";
      /** Distance covered in this leg, in metres (rounded). */
      distanceM: number;
      /** Direction taken at the *start* of this leg. `straight` means no turn. */
      turn: "straight" | "left" | "right" | "u-turn";
      text: string;
      floorSlug: string;
      /** Node where this leg ends (a junction, a floor-changer, or the goal). */
      nodeId: string;
    }
  | {
      kind: "elevator" | "stairs";
      text: string;
      /** Direction of travel — informs the icon. */
      direction: "up" | "down";
      floorSlug: string;
      /** Floor we arrive on. */
      toFloorSlug: string;
      nodeId: string;
    }
  | {
      kind: "arrive";
      text: string;
      floorSlug: string;
      nodeId: string;
    };

const UNIT_M = 0.1;
const STRAIGHT_THRESHOLD_DEG = 25;
const U_TURN_THRESHOLD_DEG = 150;

function metres(units: number): number {
  // Round to nearest integer, floor at 1 m so we never emit "0 m".
  return Math.max(1, Math.round(units * UNIT_M));
}

function distUnits(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Classify the turn at the middle node of (prev → cur → next).
 * Returns the signed turn (left/right/u-turn) or "straight" when the
 * deflection is below the threshold.
 *
 * Coordinate frame: SVG y-down. Walking east v1 = (1, 0); turning to
 * walk south v2 = (0, 1) is a *right* turn from a top-down view. The
 * 2-D cross product v1 × v2 is then positive — so positive cross =
 * right turn, negative cross = left turn.
 */
function classifyTurn(
  prev: Point,
  cur: Point,
  next: Point,
): "straight" | "left" | "right" | "u-turn" {
  const v1x = cur.x - prev.x;
  const v1y = cur.y - prev.y;
  const v2x = next.x - cur.x;
  const v2y = next.y - cur.y;
  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 < 1e-9 || len2 < 1e-9) return "straight";
  const cross = v1x * v2y - v1y * v2x;
  const dot = v1x * v2x + v1y * v2y;
  const angleDeg = Math.abs((Math.atan2(cross, dot) * 180) / Math.PI);
  if (angleDeg < STRAIGHT_THRESHOLD_DEG) return "straight";
  if (angleDeg > U_TURN_THRESHOLD_DEG) return "u-turn";
  return cross > 0 ? "right" : "left";
}

type Phrases = {
  startAt(name: string): string;
  continueFor(m: number): string;
  turnLeft(m: number): string;
  turnRight(m: number): string;
  uTurn(m: number): string;
  elevatorTo(floor: string, dir: "up" | "down"): string;
  stairsTo(floor: string, dir: "up" | "down"): string;
  arriveAt(name: string): string;
};

const PHRASES: Record<DirectionsLang, Phrases> = {
  en: {
    startAt: (name) => `Start at ${name}`,
    continueFor: (m) => `Continue for ${m} m`,
    turnLeft: (m) => `Turn left and continue ${m} m`,
    turnRight: (m) => `Turn right and continue ${m} m`,
    uTurn: (m) => `Turn around and continue ${m} m`,
    elevatorTo: (floor, dir) =>
      dir === "up"
        ? `Take the elevator up to ${floor}`
        : `Take the elevator down to ${floor}`,
    stairsTo: (floor, dir) =>
      dir === "up"
        ? `Take the stairs up to ${floor}`
        : `Take the stairs down to ${floor}`,
    arriveAt: (name) => `Arrive at ${name}`,
  },
  el: {
    startAt: (name) => `Ξεκινήστε από ${name}`,
    continueFor: (m) => `Συνεχίστε για ${m} m`,
    turnLeft: (m) => `Στρίψτε αριστερά και συνεχίστε ${m} m`,
    turnRight: (m) => `Στρίψτε δεξιά και συνεχίστε ${m} m`,
    uTurn: (m) => `Κάντε αναστροφή και συνεχίστε ${m} m`,
    elevatorTo: (floor, dir) =>
      dir === "up"
        ? `Πάρτε το ασανσέρ προς τα πάνω, στον όροφο ${floor}`
        : `Πάρτε το ασανσέρ προς τα κάτω, στον όροφο ${floor}`,
    stairsTo: (floor, dir) =>
      dir === "up"
        ? `Πάρτε τις σκάλες προς τα πάνω, στον όροφο ${floor}`
        : `Πάρτε τις σκάλες προς τα κάτω, στον όροφο ${floor}`,
    arriveAt: (name) => `Φτάνετε στο ${name}`,
  },
};

function continueText(
  phrases: Phrases,
  m: number,
  turn: "straight" | "left" | "right" | "u-turn",
): string {
  switch (turn) {
    case "left":
      return phrases.turnLeft(m);
    case "right":
      return phrases.turnRight(m);
    case "u-turn":
      return phrases.uTurn(m);
    case "straight":
    default:
      return phrases.continueFor(m);
  }
}

export type RoomRef = { floor: string; room: string };

export function buildDirections(
  path: MultiFloorPath,
  from: RoomRef,
  to: RoomRef,
  floors: FloorMap[],
  lang: DirectionsLang,
): Step[] {
  const phrases = PHRASES[lang];
  const floorBySlug = new Map(floors.map((f) => [f.floorSlug, f]));
  const lookupRoom = (floorSlug: string, roomId: string | undefined) => {
    if (!roomId) return null;
    const f = floorBySlug.get(floorSlug);
    if (!f) return null;
    return f.rooms.find((r) => r.id === roomId) ?? null;
  };
  const lookupNode = (floorSlug: string, nodeId: string): GraphNode | null => {
    const f = floorBySlug.get(floorSlug);
    if (!f) return null;
    return f.nodes.find((n) => n.id === nodeId) ?? null;
  };

  if (path.segments.length === 0) return [];

  const steps: Step[] = [];

  // Start
  const fromRoom = lookupRoom(from.floor, from.room);
  steps.push({
    kind: "start",
    floorSlug: from.floor,
    nodeId: path.segments[0].nodes[0],
    text: phrases.startAt(fromRoom ? fromRoom.name[lang] : from.room),
  });

  // Walk through every segment, accumulating distance between turn
  // events. A "turn event" is a junction where the direction deflects
  // by more than STRAIGHT_THRESHOLD_DEG.
  let pendingUnits = 0;
  let pendingTurn: "straight" | "left" | "right" | "u-turn" = "straight";
  let pendingEndNode: { floorSlug: string; nodeId: string } | null = null;

  const flush = () => {
    if (pendingUnits <= 0 || !pendingEndNode) return;
    const m = metres(pendingUnits);
    steps.push({
      kind: "continue",
      distanceM: m,
      turn: pendingTurn,
      text: continueText(phrases, m, pendingTurn),
      floorSlug: pendingEndNode.floorSlug,
      nodeId: pendingEndNode.nodeId,
    });
    pendingUnits = 0;
    pendingTurn = "straight";
    pendingEndNode = null;
  };

  for (let s = 0; s < path.segments.length; s++) {
    const seg = path.segments[s];
    const segNodes = seg.nodes
      .map((id) => lookupNode(seg.floorSlug, id))
      .filter((n): n is GraphNode => Boolean(n));

    // First node of the very first segment is the start; nothing to
    // emit. First node of any subsequent segment is the floor-changer
    // we just stepped onto, so we start fresh.
    for (let i = 1; i < segNodes.length; i++) {
      const prev = segNodes[i - 1];
      const cur = segNodes[i];
      pendingUnits += distUnits(prev.position, cur.position);
      pendingEndNode = { floorSlug: seg.floorSlug, nodeId: cur.id };

      // Look ahead for a turn at `cur` within the same segment.
      if (i < segNodes.length - 1) {
        const next = segNodes[i + 1];
        const turn = classifyTurn(prev.position, cur.position, next.position);
        if (turn !== "straight") {
          flush();
          pendingTurn = turn;
        }
      }
    }

    // End of segment: flush the final walk on this floor, then if we're
    // about to change floor, emit an elevator/stairs step.
    flush();

    if (s < path.segments.length - 1) {
      const lastNode = segNodes[segNodes.length - 1];
      const nextSeg = path.segments[s + 1];
      const nextFloor = floorBySlug.get(nextSeg.floorSlug);
      if (lastNode && nextFloor) {
        const curFloor = floorBySlug.get(seg.floorSlug);
        const dir: "up" | "down" =
          (nextFloor.level ?? 0) > (curFloor?.level ?? 0) ? "up" : "down";
        const feature = lastNode.features[0];
        const floorName = nextFloor.name[lang];
        if (feature === "stairs") {
          steps.push({
            kind: "stairs",
            direction: dir,
            floorSlug: nextSeg.floorSlug,
            toFloorSlug: nextSeg.floorSlug,
            nodeId: lastNode.id,
            text: phrases.stairsTo(floorName, dir),
          });
        } else {
          // Default: treat as elevator. (Wheelchair-lift, etc. could
          // get their own kinds in a follow-up.)
          steps.push({
            kind: "elevator",
            direction: dir,
            floorSlug: nextSeg.floorSlug,
            toFloorSlug: nextSeg.floorSlug,
            nodeId: lastNode.id,
            text: phrases.elevatorTo(floorName, dir),
          });
        }
      }
    }
  }

  // Arrive
  const toRoom = lookupRoom(to.floor, to.room);
  steps.push({
    kind: "arrive",
    floorSlug: to.floor,
    nodeId: path.segments[path.segments.length - 1].nodes.at(-1) ?? to.room,
    text: phrases.arriveAt(toRoom ? toRoom.name[lang] : to.room),
  });

  return steps;
}
