/**
 * Cross-floor link autopilot.
 *
 * Looks at `elevator_shaft` and `stairwell` rooms on the current floor.
 * For each, picks the first associated node and finds a matching shaft /
 * stairwell room on a sibling floor — preferring same `code`, falling
 * back to the same English name — then wires `connectsToFloor` on this
 * floor's node toward the sibling's node, and tags it with the right
 * accessibility feature (elevator vs stairs).
 *
 * Only touches the current floor. To get bidirectional traversal, run
 * it again on the sibling floor — that floor's link points back, and
 * the pathfinder treats the cross-floor edge as bidirectional.
 */
import type { FloorMap, GraphNode, RoomKind } from "./schema";

type SiblingLite = {
  slug: string;
  level: number;
  nameEn: string;
  nodes: { id: string; roomId?: string }[];
  rooms: { id: string; code?: string; nameEn: string; kind: RoomKind }[];
};

export type CrossFloorLinkResult = {
  map: FloorMap;
  linksAdded: number;
  /** Rooms that matched a sibling but the link was already set correctly. */
  linksAlreadyPresent: number;
  /** Rooms we couldn't link, with a short reason for UI feedback. */
  skipped: { roomLabel: string; reason: string }[];
};

const SHAFT_KINDS: ReadonlyArray<RoomKind> = ["elevator_shaft", "stairwell"];

function featureFor(kind: RoomKind): "elevator" | "stairs" | null {
  if (kind === "elevator_shaft") return "elevator";
  if (kind === "stairwell") return "stairs";
  return null;
}

function matchSiblingRoom(
  ourRoom: { code?: string; nameEn: string },
  siblingRooms: SiblingLite["rooms"],
  kind: RoomKind,
): { id: string } | null {
  const sameKind = siblingRooms.filter((r) => r.kind === kind);
  if (ourRoom.code) {
    const c = ourRoom.code.toLowerCase();
    const byCode = sameKind.find((r) => r.code && r.code.toLowerCase() === c);
    if (byCode) return byCode;
  }
  const n = ourRoom.nameEn.toLowerCase();
  const byName = sameKind.find((r) => r.nameEn.toLowerCase() === n);
  return byName ?? null;
}

export function autoLinkCrossFloor(
  floor: FloorMap,
  siblings: SiblingLite[],
): CrossFloorLinkResult {
  const skipped: CrossFloorLinkResult["skipped"] = [];
  let linksAdded = 0;
  let linksAlreadyPresent = 0;

  const nextNodes: GraphNode[] = floor.nodes.map((n) => n);

  for (const room of floor.rooms) {
    if (!SHAFT_KINDS.includes(room.kind)) continue;
    const label = room.code ? `${room.code} · ${room.name.en}` : room.name.en;

    const feature = featureFor(room.kind);
    if (!feature) continue;

    const ourNodeIdx = nextNodes.findIndex((n) => n.roomId === room.id);
    if (ourNodeIdx < 0) {
      skipped.push({
        roomLabel: label,
        reason: "no node assigned in room",
      });
      continue;
    }

    // Find the first sibling with a matching room AND at least one node in it.
    let matched:
      | { sibling: SiblingLite; sibRoomId: string; sibNodeId: string }
      | null = null;
    for (const sib of siblings) {
      const hit = matchSiblingRoom(
        { code: room.code, nameEn: room.name.en },
        sib.rooms,
        room.kind,
      );
      if (!hit) continue;
      const sibNode = sib.nodes.find((n) => n.roomId === hit.id);
      if (!sibNode) continue;
      matched = { sibling: sib, sibRoomId: hit.id, sibNodeId: sibNode.id };
      break;
    }

    if (!matched) {
      skipped.push({
        roomLabel: label,
        reason: room.code
          ? `no matching ${room.kind} on another floor (looking for code "${room.code}")`
          : `no matching ${room.kind} on another floor; set a code to match across floors`,
      });
      continue;
    }

    const ours = nextNodes[ourNodeIdx];
    const already =
      ours.connectsToFloor?.floorSlug === matched.sibling.slug &&
      ours.connectsToFloor?.nodeId === matched.sibNodeId &&
      ours.features.includes(feature);
    if (already) {
      linksAlreadyPresent++;
      continue;
    }
    nextNodes[ourNodeIdx] = {
      ...ours,
      connectsToFloor: {
        floorSlug: matched.sibling.slug,
        nodeId: matched.sibNodeId,
      },
      features: ours.features.includes(feature)
        ? ours.features
        : [...ours.features, feature],
    };
    linksAdded++;
  }

  return {
    map: { ...floor, nodes: nextNodes },
    linksAdded,
    linksAlreadyPresent,
    skipped,
  };
}
