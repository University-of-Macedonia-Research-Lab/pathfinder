"use client";

import { useMemo, useState } from "react";
import type {
  AccessibilityFeature,
  Door,
  FloorMap,
  GraphEdge,
  GraphNode,
  Room,
  RoomKind,
  WallSegment,
} from "@/lib/map/schema";

type Props = {
  map: FloorMap;
  /** Show the routing graph overlay (nodes + edges). Useful while teaching. */
  showGraph?: boolean;
  /** Highlight an ordered list of node ids, used to draw a computed route. */
  highlightedRoute?: string[];
  /** Single node id to emphasise on top of the route — e.g. the node a
   *  selected directions step lands on. Drawn as a pulsing brand ring. */
  emphasisedNodeId?: string;
  /** Language for labels. */
  lang?: "en" | "el";
  onRoomClick?: (roomId: string) => void;
};

const ROOM_FILL: Record<RoomKind, string> = {
  classroom: "oklch(0.94 0.025 250)",
  office: "oklch(0.94 0.025 295)",
  lab: "oklch(0.93 0.04 330)",
  lecture_hall: "oklch(0.94 0.04 80)",
  bathroom: "oklch(0.93 0.04 200)",
  stairwell: "oklch(0.92 0.04 30)",
  elevator_shaft: "oklch(0.93 0.06 65)",
  corridor: "oklch(0.96 0.005 95)",
  entrance: "oklch(0.93 0.05 150)",
  outdoor: "oklch(0.95 0.05 130)",
  other: "oklch(0.95 0.005 95)",
};

const FEATURE_GLYPH: Record<AccessibilityFeature, string> = {
  elevator: "E",
  stairs: "S",
  ramp: "R",
  wheelchair_lift: "L",
  accessible_bathroom: "♿",
  bathroom: "WC",
  automatic_door: "⇆",
  narrow_passage: "‖",
  step: "▲",
};

function polygonToPathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [head, ...tail] = points;
  return `M ${head.x} ${head.y} ${tail
    .map((p) => `L ${p.x} ${p.y}`)
    .join(" ")} Z`;
}

function centroid(points: { x: number; y: number }[]) {
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/** SVG content groups, *without* the outer <svg>. Used both standalone (via
 *  FloorMapView) and embedded inside Leaflet's <SVGOverlay>. Render order
 *  builds up like an architectural drawing: floor base → rooms → interior
 *  partitions → exterior shell → windows → doors → labels → icons → graph
 *  → route halo → route. */
export function FloorMapInner({
  map,
  showGraph = false,
  highlightedRoute,
  emphasisedNodeId,
  lang = "en",
  onRoomClick,
}: Props) {
  const [hoverRoom, setHoverRoom] = useState<string | null>(null);

  const { minX, minY, maxX, maxY } = map.bounds;
  const longest = Math.max(maxX - minX, maxY - minY);

  const nodesById = useMemo(
    () => new Map(map.nodes.map((n) => [n.id, n])),
    [map.nodes],
  );

  const routeSegments = useMemo(() => {
    if (!highlightedRoute || highlightedRoute.length < 2) return [];
    const segs: { from: GraphNode; to: GraphNode }[] = [];
    for (let i = 0; i < highlightedRoute.length - 1; i++) {
      const from = nodesById.get(highlightedRoute[i]);
      const to = nodesById.get(highlightedRoute[i + 1]);
      if (from && to) segs.push({ from, to });
    }
    return segs;
  }, [highlightedRoute, nodesById]);

  const interiorWalls = map.walls.filter((w) => w.kind === "interior");
  const exteriorWalls = map.walls.filter((w) => w.kind === "exterior");
  const windows = map.walls.filter((w) => w.kind === "window");

  // Stroke weights, scaled to the floor's longest side so they read
  // consistently regardless of map size.
  const W_EXTERIOR = longest * 0.014;
  const W_INTERIOR = longest * 0.007;
  const W_WINDOW   = longest * 0.012;
  const ROUTE      = longest * 0.012;
  const ROUTE_HALO = ROUTE + longest * 0.008;

  return (
    <>
      {/* Floor base, the building's interior fill. */}
      {map.outline && (
        <path
          d={polygonToPathD(map.outline)}
          fill="var(--floor-base, #fafaf9)"
          stroke="none"
        />
      )}

      {/* Rooms */}
      <g>
        {map.rooms.map((room) => (
          <RoomShape
            key={room.id}
            room={room}
            highlighted={hoverRoom === room.id}
            clickable={Boolean(onRoomClick)}
            onEnter={() => setHoverRoom(room.id)}
            onLeave={() => setHoverRoom(null)}
            onClick={() => onRoomClick?.(room.id)}
          />
        ))}
      </g>

      {/* Interior partitions, drawn over rooms but under the exterior shell. */}
      <g>
        {interiorWalls.map((w) => (
          <Wall key={w.id} wall={w} thickness={W_INTERIOR} kind="interior" />
        ))}
      </g>

      {/* Exterior shell, outline polygon (if any) + explicit exterior walls. */}
      {map.outline && (
        <path
          d={polygonToPathD(map.outline)}
          fill="none"
          stroke="var(--wall-exterior, #1f2937)"
          strokeWidth={W_EXTERIOR}
          strokeLinejoin="miter"
        />
      )}
      <g>
        {exteriorWalls.map((w) => (
          <Wall key={w.id} wall={w} thickness={W_EXTERIOR} kind="exterior" />
        ))}
      </g>

      {/* Windows, drawn over the exterior shell as cyan glass cuts. */}
      <g>
        {windows.map((w) => (
          <Window key={w.id} wall={w} thickness={W_WINDOW} />
        ))}
      </g>

      {/* Doors */}
      <g>
        {map.doors.map((door) => (
          <DoorMark key={door.id} door={door} radius={longest * 0.008} />
        ))}
      </g>

      {/* Room labels */}
      <g pointerEvents="none">
        {map.rooms.map((room) => {
          const c = centroid(room.polygon);
          const label = room.code ?? room.name[lang];
          return (
            <text
              key={room.id}
              x={c.x}
              y={c.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={longest * 0.022}
              fill="oklch(0.3 0.02 270)"
              fontFamily="var(--font-sans)"
              fontWeight={500}
            >
              {label}
            </text>
          );
        })}
      </g>

      {/* Accessibility feature icons (drawn from nodes that carry features) */}
      <g pointerEvents="none">
        {map.nodes
          .filter((n) => n.features.length > 0)
          .map((n) => (
            <FeatureIcon key={n.id} node={n} fontSize={longest * 0.028} />
          ))}
      </g>

      {/* Optional graph overlay (teaching mode) */}
      {showGraph && (
        <g opacity={0.55}>
          {map.edges.map((edge) => (
            <EdgeLine
              key={edge.id}
              edge={edge}
              nodesById={nodesById}
              longest={longest}
            />
          ))}
          {map.nodes.map((n) => (
            <circle
              key={n.id}
              cx={n.position.x}
              cy={n.position.y}
              r={longest * 0.005}
              fill="oklch(0.3 0.02 270)"
            />
          ))}
        </g>
      )}

      {/* Highlighted route, drawn as a white halo + colored stroke on top so
          it's visible against any surface (the Google/Apple Maps idiom). */}
      {routeSegments.length > 0 && (
        <>
          <g>
            {routeSegments.map((seg, i) => (
              <line
                key={`halo-${i}`}
                x1={seg.from.position.x}
                y1={seg.from.position.y}
                x2={seg.to.position.x}
                y2={seg.to.position.y}
                stroke="var(--route-halo)"
                strokeWidth={ROUTE_HALO}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
          <g>
            {routeSegments.map((seg, i) => (
              <line
                key={`route-${i}`}
                x1={seg.from.position.x}
                y1={seg.from.position.y}
                x2={seg.to.position.x}
                y2={seg.to.position.y}
                stroke="var(--route)"
                strokeWidth={ROUTE}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
          {/* Endpoint markers */}
          {[routeSegments[0]?.from, routeSegments[routeSegments.length - 1]?.to]
            .filter(Boolean)
            .map((node, i) => (
              <g key={`ep-${i}`}>
                <circle
                  cx={node!.position.x}
                  cy={node!.position.y}
                  r={longest * 0.013}
                  fill="var(--route-halo)"
                />
                <circle
                  cx={node!.position.x}
                  cy={node!.position.y}
                  r={longest * 0.008}
                  fill="var(--route)"
                />
              </g>
            ))}
        </>
      )}

      {/* Step emphasis ring — pulsing brand circle anchored on whichever
          node a selected directions step points to, drawn last so it
          sits on top of the route. */}
      {emphasisedNodeId && (() => {
        const node = nodesById.get(emphasisedNodeId);
        if (!node) return null;
        const r = longest * 0.018;
        return (
          <g pointerEvents="none">
            <circle
              cx={node.position.x}
              cy={node.position.y}
              r={r * 2.4}
              fill="var(--brand)"
              className="accessmap-step-pulse"
            />
            <circle
              cx={node.position.x}
              cy={node.position.y}
              r={r}
              fill="var(--route-halo)"
              stroke="var(--brand)"
              strokeWidth={r * 0.35}
            />
            <circle
              cx={node.position.x}
              cy={node.position.y}
              r={r * 0.45}
              fill="var(--brand)"
            />
          </g>
        );
      })()}
    </>
  );
}

/** Standalone version with its own <svg> wrapper and padded viewBox. */
export function FloorMapView(props: Props) {
  const { minX, minY, maxX, maxY } = props.map.bounds;
  const pad = Math.max(maxX - minX, maxY - minY) * 0.06;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${
    maxY - minY + pad * 2
  }`;

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={`Floor plan: ${props.map.name[props.lang ?? "en"]}`}
      className="h-full w-full bg-[var(--surface-2)]"
    >
      <FloorMapInner {...props} />
    </svg>
  );
}

function RoomShape({
  room,
  highlighted,
  clickable,
  onEnter,
  onLeave,
  onClick,
}: {
  room: Room;
  highlighted: boolean;
  clickable: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <path
      d={polygonToPathD(room.polygon)}
      fill={highlighted ? "var(--accent-soft)" : ROOM_FILL[room.kind]}
      stroke="oklch(0.7 0.02 270)"
      strokeWidth={0.3}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ cursor: clickable ? "pointer" : "default" }}
    />
  );
}

function Wall({
  wall,
  thickness,
  kind,
}: {
  wall: WallSegment;
  thickness: number;
  kind: "exterior" | "interior";
}) {
  return (
    <line
      x1={wall.start.x}
      y1={wall.start.y}
      x2={wall.end.x}
      y2={wall.end.y}
      stroke={
        kind === "exterior"
          ? "var(--wall-exterior, #1f2937)"
          : "var(--wall-interior, #475569)"
      }
      strokeWidth={thickness}
      strokeLinecap="butt"
    />
  );
}

function Window({ wall, thickness }: { wall: WallSegment; thickness: number }) {
  return (
    <>
      {/* white core that visually "cuts" the exterior wall */}
      <line
        x1={wall.start.x}
        y1={wall.start.y}
        x2={wall.end.x}
        y2={wall.end.y}
        stroke="var(--floor-base, #fafaf9)"
        strokeWidth={thickness}
        strokeLinecap="butt"
      />
      {/* cyan glass on top */}
      <line
        x1={wall.start.x}
        y1={wall.start.y}
        x2={wall.end.x}
        y2={wall.end.y}
        stroke="var(--window-glass, #38bdf8)"
        strokeWidth={thickness * 0.55}
        strokeLinecap="butt"
      />
    </>
  );
}

function DoorMark({ door, radius }: { door: Door; radius: number }) {
  return (
    <circle
      cx={door.position.x}
      cy={door.position.y}
      r={radius}
      fill="var(--door-mark, #ffffff)"
      stroke="oklch(0.5 0.02 270)"
      strokeWidth={radius * 0.25}
    />
  );
}

function FeatureIcon({
  node,
  fontSize,
}: {
  node: GraphNode;
  fontSize: number;
}) {
  const glyph = FEATURE_GLYPH[node.features[0]];
  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      <circle r={fontSize * 0.95} fill="var(--feature, #0ea5e9)" />
      <circle
        r={fontSize * 0.95}
        fill="none"
        stroke="oklch(1 0 0 / 0.5)"
        strokeWidth={fontSize * 0.08}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fill="oklch(1 0 0)"
        fontWeight={700}
        fontFamily="var(--font-sans)"
      >
        {glyph}
      </text>
    </g>
  );
}

function EdgeLine({
  edge,
  nodesById,
  longest,
}: {
  edge: GraphEdge;
  nodesById: Map<string, GraphNode>;
  longest: number;
}) {
  const a = nodesById.get(edge.from);
  const b = nodesById.get(edge.to);
  if (!a || !b) return null;
  const stairs = edge.features.includes("stairs");
  return (
    <line
      x1={a.position.x}
      y1={a.position.y}
      x2={b.position.x}
      y2={b.position.y}
      stroke={stairs ? "oklch(0.6 0.21 27)" : "oklch(0.3 0.02 270)"}
      strokeWidth={longest * 0.0035}
      strokeDasharray={stairs ? `${longest * 0.012} ${longest * 0.012}` : undefined}
    />
  );
}
