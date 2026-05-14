"use client";

/**
 * Editor canvas. Renders walls, doors, rooms, and the routing graph on a
 * Leaflet + CRS.Simple map. Click semantics depend on the active tool — see
 * floor-editor.tsx for the dispatch.
 *
 * Coordinate note: Leaflet's CRS.Simple has lat going *up* while our SVG
 * viewBox has y going *down*. Wherever we read Leaflet's `latlng` we flip
 * lat → svg_y with `bounds.maxY + bounds.minY - lat`.
 *
 * Snap pipeline (clicks and the preview cursor both go through it):
 *   raw → endpoint? → intersection? (with anchor) → ortho? (with anchor) → grid? → result
 * The first hit wins; later snaps are skipped. `kind` is reported back so we
 * can render an indicator at the snapped point.
 */
import { useMemo, useRef, useState } from "react";
import { MapContainer, SVGOverlay, ZoomControl, useMapEvent } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FloorMap, Point } from "@/lib/map/schema";
import {
  collectEndpoints,
  snapOrtho,
  snapToGrid,
  snapToIntersection,
  snapToNearestEndpoint,
  type SnapResult,
} from "@/lib/map/snap";
import type { Drawing, Selected, SnapState } from "./types";
import type { Mode, Tool } from "./tool-palette";

type Props = {
  map: FloorMap;
  mode: Mode;
  tool: Tool;
  drawing: Drawing;
  selected: Selected;
  snap: SnapState;
  onCanvasClick: (pos: Point) => void;
  onEntityClick: (s: NonNullable<Selected>) => void;
  onCommitDrawing: () => void;
  onNodeDrag: (id: string, pos: Point) => void;
};

export function EditorCanvas(props: Props) {
  const { minX, minY, maxX, maxY } = props.map.bounds;
  const w = maxX - minX;
  const h = maxY - minY;
  const longest = Math.max(w, h);

  const bounds = useMemo<L.LatLngBoundsExpression>(
    () => [[minY, minX], [maxY, maxX]],
    [minY, minX, maxY, maxX],
  );
  const maxBounds = useMemo<L.LatLngBoundsExpression>(() => {
    const pad = longest;
    return [[minY - pad, minX - pad], [maxY + pad, maxX + pad]];
  }, [minX, minY, maxX, maxY, longest]);

  // Snap configuration that derives from bounds; passed to the click handler
  // and the overlay so both share the same pipeline.
  const snapCfg = useMemo(() => {
    const step = Math.max(1, Math.round(longest / 20));
    return {
      gridStep: step,
      // Threshold for endpoint/intersection snap, in floor units. Tight
      // enough that you don't accidentally snap when the cursor is far,
      // wide enough to forgive a few pixels of misalignment.
      threshold: longest * 0.025,
    };
  }, [longest]);

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={maxBounds}
      maxBoundsViscosity={1}
      minZoom={-3}
      maxZoom={6}
      zoomSnap={0.1}
      zoomDelta={0.5}
      attributionControl={false}
      zoomControl={false}
      doubleClickZoom={false}
      className="h-full w-full bg-[var(--surface-2)]"
    >
      <ZoomControl position="topright" />
      <SVGOverlay
        bounds={bounds}
        attributes={{
          viewBox: `${minX} ${minY} ${w} ${h}`,
          preserveAspectRatio: "none",
        }}
      >
        <EditorOverlay {...props} longest={longest} snapCfg={snapCfg} />
      </SVGOverlay>
      <CanvasMapEvents
        bounds={props.map.bounds}
        map={props.map}
        tool={props.tool}
        drawing={props.drawing}
        snap={props.snap}
        snapCfg={snapCfg}
        onCanvasClick={props.onCanvasClick}
        onCommitDrawing={props.onCommitDrawing}
      />
    </MapContainer>
  );
}

// ---------------------------------------------------------------------------
// Snap pipeline
// ---------------------------------------------------------------------------

function applySnap(
  raw: Point,
  opts: {
    map: FloorMap;
    drawing: Drawing;
    snap: SnapState;
    threshold: number;
    gridStep: number;
  },
): SnapResult {
  const { map, drawing, snap, threshold, gridStep } = opts;

  // 1. Endpoint snap — strongest, because the user wants connectivity.
  if (snap.endpoint) {
    const candidates = collectEndpoints(map);
    // While drawing, the points already placed in the current run also
    // count as endpoints so you can close walls/polygons back on themselves.
    if (drawing.kind === "wall" || drawing.kind === "polygon") {
      for (const p of drawing.points) candidates.push(p);
    }
    if (drawing.kind === "graphLine") {
      for (const p of drawing.points) candidates.push(p.point);
    }
    const hit = snapToNearestEndpoint(raw, candidates, threshold);
    if (hit) return { point: hit, kind: "endpoint" };
  }

  // The anchor is the last point already placed in the current run.
  const anchor =
    drawing.kind === "wall" && drawing.points.length > 0
      ? drawing.points[drawing.points.length - 1]
      : drawing.kind === "polygon" && drawing.points.length > 0
      ? drawing.points[drawing.points.length - 1]
      : drawing.kind === "graphLine" && drawing.points.length > 0
      ? drawing.points[drawing.points.length - 1].point
      : null;

  // 2. Intersection snap — only meaningful when we have an anchor.
  if (snap.intersection && anchor) {
    const hit = snapToIntersection(anchor, raw, map.walls, threshold);
    if (hit) return { point: hit, kind: "intersection" };
  }

  // 3. Ortho constraint — applies to the next segment when there's an anchor.
  let p = raw;
  let kind: SnapResult["kind"] = null;
  if (snap.ortho && anchor) {
    p = snapOrtho(anchor, p);
    kind = "ortho";
  }

  // 4. Grid snap — last because it's least specific.
  if (snap.grid) {
    p = snapToGrid(p, gridStep);
    if (kind === null) kind = "grid";
  }

  return { point: p, kind };
}

// ---------------------------------------------------------------------------
// Map-level click/dblclick events
// ---------------------------------------------------------------------------

function CanvasMapEvents({
  bounds,
  map,
  tool,
  drawing,
  snap,
  snapCfg,
  onCanvasClick,
  onCommitDrawing,
}: {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  map: FloorMap;
  tool: Tool;
  drawing: Drawing;
  snap: SnapState;
  snapCfg: { gridStep: number; threshold: number };
  onCanvasClick: (pos: Point) => void;
  onCommitDrawing: () => void;
}) {
  useMapEvent("click", (e) => {
    const raw: Point = {
      x: e.latlng.lng,
      y: bounds.maxY + bounds.minY - e.latlng.lat,
    };
    const s = applySnap(raw, {
      map,
      drawing,
      snap,
      threshold: snapCfg.threshold,
      gridStep: snapCfg.gridStep,
    });
    onCanvasClick(s.point);
  });
  useMapEvent("dblclick", () => {
    // Wall, polygon, and graph-line all commit on double-click.
    if (
      (tool === "polygon" && drawing.kind === "polygon") ||
      (drawing.kind === "wall" &&
        (tool === "wall" || tool === "exterior-wall" || tool === "window")) ||
      (drawing.kind === "graphLine" && tool === "drawGraph")
    ) {
      onCommitDrawing();
    }
  });
  return null;
}

// ---------------------------------------------------------------------------
// SVG overlay
// ---------------------------------------------------------------------------

function EditorOverlay({
  map,
  mode,
  tool,
  drawing,
  selected,
  snap,
  onEntityClick,
  onNodeDrag,
  longest,
  snapCfg,
}: Props & {
  longest: number;
  snapCfg: { gridStep: number; threshold: number };
}) {
  const [cursor, setCursor] = useState<Point | null>(null);
  const [snappedCursor, setSnappedCursor] = useState<SnapResult | null>(null);
  // Hovered entity — drives the "about to delete" highlight in delete mode.
  const [hovered, setHovered] = useState<NonNullable<Selected> | null>(null);

  const enterHover = (s: NonNullable<Selected>) => setHovered(s);
  const leaveHover = (s: NonNullable<Selected>) =>
    setHovered((h) => (h && h.kind === s.kind && h.id === s.id ? null : h));
  const isHoverDelete = (s: NonNullable<Selected>) =>
    tool === "delete" && hovered?.kind === s.kind && hovered.id === s.id;

  const nodeRadius = longest * 0.012;
  const edgeWidth = longest * 0.005;
  const W_EXTERIOR = longest * 0.014;
  const W_INTERIOR = longest * 0.008;
  const W_WINDOW = longest * 0.012;

  function clientToFloor(svg: SVGSVGElement, clientX: number, clientY: number): Point | null {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  const wantsCursor =
    drawing.kind === "wall" ||
    drawing.kind === "polygon" ||
    drawing.kind === "graphLine" ||
    tool === "wall" ||
    tool === "exterior-wall" ||
    tool === "window" ||
    tool === "polygon" ||
    tool === "door" ||
    tool === "drawGraph";

  return (
    <g>
      {/* Floor base */}
      <rect
        x={map.bounds.minX}
        y={map.bounds.minY}
        width={map.bounds.maxX - map.bounds.minX}
        height={map.bounds.maxY - map.bounds.minY}
        fill="var(--floor-base)"
        stroke="var(--border)"
        strokeWidth={longest * 0.003}
        pointerEvents="none"
      />
      <Grid bounds={map.bounds} step={snapCfg.gridStep} longest={longest} />

      {/* Cursor capture rect (only when relevant). Updates both raw cursor
          and snapped cursor so the overlay can show the preview + badge. */}
      {wantsCursor && (
        <rect
          x={map.bounds.minX}
          y={map.bounds.minY}
          width={map.bounds.maxX - map.bounds.minX}
          height={map.bounds.maxY - map.bounds.minY}
          fill="transparent"
          onMouseMove={(e) => {
            const svg = (e.currentTarget as SVGRectElement).ownerSVGElement;
            if (!svg) return;
            const raw = clientToFloor(svg, e.clientX, e.clientY);
            if (!raw) return;
            setCursor(raw);
            const s = applySnap(raw, {
              map,
              drawing,
              snap,
              threshold: snapCfg.threshold,
              gridStep: snapCfg.gridStep,
            });
            setSnappedCursor(s);
          }}
          onMouseLeave={() => {
            setCursor(null);
            setSnappedCursor(null);
          }}
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Rooms */}
      <g>
        {map.rooms.map((r) => {
          const isSelected = selected?.kind === "room" && selected.id === r.id;
          // Also highlight the room when one of its associated nodes is selected,
          // so the user can see the node↔room link they configured.
          const linkedNodeSelected =
            selected?.kind === "node" &&
            map.nodes.find((n) => n.id === selected.id)?.roomId === r.id;
          const highlight = isSelected || linkedNodeSelected;
          const clickable = mode === "rooms" || tool === "delete";
          const willDelete = isHoverDelete({ kind: "room", id: r.id });
          return (
            <polygon
              key={r.id}
              points={r.polygon.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={
                willDelete
                  ? "oklch(0.6 0.21 27 / 0.4)"
                  : highlight
                  ? "var(--brand-soft)"
                  : "oklch(0.95 0.02 270 / 0.7)"
              }
              stroke={
                willDelete
                  ? "var(--destructive)"
                  : highlight
                  ? "var(--brand)"
                  : "oklch(0.7 0.02 270)"
              }
              strokeWidth={
                willDelete
                  ? longest * 0.012
                  : highlight
                  ? longest * 0.005
                  : longest * 0.0025
              }
              strokeDasharray={willDelete ? `${longest * 0.014} ${longest * 0.008}` : undefined}
              pointerEvents="all"
              style={{ cursor: clickable ? "pointer" : "default" }}
              onMouseEnter={() => clickable && enterHover({ kind: "room", id: r.id })}
              onMouseLeave={() => leaveHover({ kind: "room", id: r.id })}
              onMouseDown={(e) => {
                if (clickable) e.stopPropagation();
              }}
              onClick={(e) => {
                if (!clickable) return;
                e.stopPropagation();
                onEntityClick({ kind: "room", id: r.id });
              }}
            />
          );
        })}
      </g>

      {/* Polygon in progress */}
      {drawing.kind === "polygon" && (
        <PolygonPreview
          points={drawing.points}
          cursor={snappedCursor?.point ?? cursor}
          longest={longest}
        />
      )}

      {/* Walls — visible stroke (non-interactive) + invisible fat hit line. */}
      <g>
        {map.walls.map((w) => {
          const isSelected = selected?.kind === "wall" && selected.id === w.id;
          const stroke =
            w.kind === "exterior"
              ? "var(--wall-exterior)"
              : w.kind === "window"
              ? "var(--window-glass)"
              : "var(--wall-interior)";
          const thickness =
            w.kind === "exterior" ? W_EXTERIOR : w.kind === "window" ? W_WINDOW : W_INTERIOR;
          const clickable = mode === "structure" || tool === "delete";
          const hitWidth = Math.max(thickness * 3, longest * 0.018);
          const willDelete = isHoverDelete({ kind: "wall", id: w.id });
          return (
            <g key={w.id}>
              <line
                x1={w.start.x}
                y1={w.start.y}
                x2={w.end.x}
                y2={w.end.y}
                stroke={
                  willDelete
                    ? "var(--destructive)"
                    : isSelected
                    ? "var(--brand)"
                    : stroke
                }
                strokeWidth={willDelete ? thickness * 1.4 : thickness}
                strokeLinecap="butt"
                pointerEvents="none"
              />
              {clickable && (
                <line
                  x1={w.start.x}
                  y1={w.start.y}
                  x2={w.end.x}
                  y2={w.end.y}
                  stroke="transparent"
                  strokeWidth={hitWidth}
                  strokeLinecap="butt"
                  pointerEvents="stroke"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => enterHover({ kind: "wall", id: w.id })}
                  onMouseLeave={() => leaveHover({ kind: "wall", id: w.id })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEntityClick({ kind: "wall", id: w.id });
                  }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Wall in progress — chained segments + dashed preview to cursor */}
      {drawing.kind === "wall" && (
        <WallPreview
          points={drawing.points}
          cursor={snappedCursor?.point ?? cursor}
          wallKind={drawing.wallKind}
          longest={longest}
          thicknesses={{ exterior: W_EXTERIOR, interior: W_INTERIOR, window: W_WINDOW }}
        />
      )}

      {/* Doors — visible mark + invisible larger hit circle. */}
      <g>
        {map.doors.map((d) => {
          const isSelected = selected?.kind === "door" && selected.id === d.id;
          const clickable = mode === "structure" || tool === "delete";
          const visibleR = longest * 0.01;
          const hitR = longest * 0.022;
          const willDelete = isHoverDelete({ kind: "door", id: d.id });
          return (
            <g key={d.id}>
              <circle
                cx={d.position.x}
                cy={d.position.y}
                r={willDelete ? visibleR * 1.3 : visibleR}
                fill={willDelete ? "var(--destructive)" : "var(--door-mark)"}
                stroke={
                  willDelete
                    ? "var(--destructive)"
                    : isSelected
                    ? "var(--brand)"
                    : "oklch(0.5 0.02 270)"
                }
                strokeWidth={longest * 0.003}
                pointerEvents="none"
              />
              {clickable && (
                <circle
                  cx={d.position.x}
                  cy={d.position.y}
                  r={hitR}
                  fill="transparent"
                  pointerEvents="all"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => enterHover({ kind: "door", id: d.id })}
                  onMouseLeave={() => leaveHover({ kind: "door", id: d.id })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEntityClick({ kind: "door", id: d.id });
                  }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Graph edges — visible thin line + invisible fat hit line. */}
      <g>
        {map.edges.map((e) => {
          const a = map.nodes.find((n) => n.id === e.from);
          const b = map.nodes.find((n) => n.id === e.to);
          if (!a || !b) return null;
          const isSelected = selected?.kind === "edge" && selected.id === e.id;
          const clickable = mode === "graph" || tool === "delete";
          const hitWidth = Math.max(edgeWidth * 4, longest * 0.018);
          const willDelete = isHoverDelete({ kind: "edge", id: e.id });
          return (
            <g key={e.id}>
              <line
                x1={a.position.x}
                y1={a.position.y}
                x2={b.position.x}
                y2={b.position.y}
                stroke={
                  willDelete
                    ? "var(--destructive)"
                    : isSelected
                    ? "var(--brand)"
                    : "oklch(0.4 0.05 270)"
                }
                strokeWidth={willDelete ? edgeWidth * 1.6 : edgeWidth}
                strokeLinecap="round"
                pointerEvents="none"
              />
              {clickable && (
                <line
                  x1={a.position.x}
                  y1={a.position.y}
                  x2={b.position.x}
                  y2={b.position.y}
                  stroke="transparent"
                  strokeWidth={hitWidth}
                  strokeLinecap="round"
                  pointerEvents="stroke"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => enterHover({ kind: "edge", id: e.id })}
                  onMouseLeave={() => leaveHover({ kind: "edge", id: e.id })}
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onEntityClick({ kind: "edge", id: e.id });
                  }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Graph polyline in progress */}
      {drawing.kind === "graphLine" && (
        <GraphLinePreview
          points={drawing.points.map((p) => p.point)}
          cursor={snappedCursor?.point ?? cursor}
          longest={longest}
        />
      )}

      {/* Graph nodes */}
      <g>
        {map.nodes.map((n) => {
          const isSelected = selected?.kind === "node" && selected.id === n.id;
          // Highlight nodes that belong to the currently selected room.
          const linkedRoomSelected =
            selected?.kind === "room" && n.roomId === selected.id;
          // Highlight any node that's already referenced in an in-progress
          // graph polyline, so the user can see where the chain anchored.
          const pending =
            drawing.kind === "graphLine" &&
            drawing.points.some((p) => p.nodeId === n.id);
          const willDelete = isHoverDelete({ kind: "node", id: n.id });
          const room = n.roomId ? map.rooms.find((r) => r.id === n.roomId) : null;
          const ringStroke =
            linkedRoomSelected ? "var(--brand-strong)" : "white";
          const ringStrokeWidth =
            linkedRoomSelected ? nodeRadius * 0.5 : nodeRadius * 0.25;
          return (
            <g key={n.id}>
              <DraggableNode
                cx={n.position.x}
                cy={n.position.y}
                r={willDelete ? nodeRadius * 1.3 : nodeRadius}
                fill={
                  willDelete
                    ? "var(--destructive)"
                    : pending
                    ? "var(--brand-strong)"
                    : isSelected
                    ? "var(--brand)"
                    : "oklch(0.55 0.21 285)"
                }
                stroke={ringStroke}
                strokeWidth={ringStrokeWidth}
                draggable={mode === "graph" && tool === "select"}
                onPositionChange={(pos) => onNodeDrag(n.id, pos)}
                onClick={() => {
                  if (mode === "graph" || tool === "delete")
                    onEntityClick({ kind: "node", id: n.id });
                }}
                onEnter={() =>
                  (mode === "graph" || tool === "delete") &&
                  enterHover({ kind: "node", id: n.id })
                }
                onLeave={() => leaveHover({ kind: "node", id: n.id })}
                cursor={
                  mode === "graph" && tool === "select"
                    ? "grab"
                    : mode === "graph" || tool === "delete"
                    ? "pointer"
                    : "default"
                }
              />
              {/* Small room-link label under the node, visible whenever the
                  node is associated with a room. Lets you scan the floor and
                  see all assignments at a glance. */}
              {room && (
                <text
                  x={n.position.x}
                  y={n.position.y + nodeRadius * 2.2}
                  textAnchor="middle"
                  fontSize={longest * 0.018}
                  fill="var(--muted-foreground)"
                  fontFamily="var(--font-sans)"
                  fontWeight={500}
                  pointerEvents="none"
                >
                  {room.code ?? room.name.en}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Snap indicator — drawn last so it sits on top of everything else. */}
      {wantsCursor && snappedCursor?.kind && (
        <SnapIndicator
          point={snappedCursor.point}
          kind={snappedCursor.kind}
          longest={longest}
        />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Drawing previews
// ---------------------------------------------------------------------------

function WallPreview({
  points,
  cursor,
  wallKind,
  longest,
  thicknesses,
}: {
  points: Point[];
  cursor: Point | null;
  wallKind: "interior" | "exterior" | "window";
  longest: number;
  thicknesses: { exterior: number; interior: number; window: number };
}) {
  if (points.length === 0) return null;
  const thickness =
    wallKind === "exterior"
      ? thicknesses.exterior
      : wallKind === "window"
      ? thicknesses.window
      : thicknesses.interior;
  const stroke =
    wallKind === "exterior"
      ? "var(--wall-exterior)"
      : wallKind === "window"
      ? "var(--window-glass)"
      : "var(--wall-interior)";
  const dotR = longest * 0.008;
  const lineW = longest * 0.003;

  return (
    <g pointerEvents="none">
      {/* Committed segments of the run */}
      {points.length >= 2 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          opacity={0.85}
        />
      )}
      {/* Dashed preview from last placed point to cursor */}
      {cursor && (
        <line
          x1={points[points.length - 1].x}
          y1={points[points.length - 1].y}
          x2={cursor.x}
          y2={cursor.y}
          stroke="var(--brand)"
          strokeWidth={thickness * 0.7}
          strokeDasharray={`${longest * 0.01} ${longest * 0.008}`}
        />
      )}
      {/* Vertex markers */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={dotR}
          fill="white"
          stroke="var(--brand)"
          strokeWidth={lineW}
        />
      ))}
    </g>
  );
}

function GraphLinePreview({
  points,
  cursor,
  longest,
}: {
  points: Point[];
  cursor: Point | null;
  longest: number;
}) {
  if (points.length === 0) return null;
  const all = cursor ? [...points, cursor] : points;
  const lineW = longest * 0.005;
  const dotR = longest * 0.009;

  return (
    <g pointerEvents="none">
      {points.length >= 1 && cursor && (
        <polyline
          points={all.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={lineW}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={
            points.length >= 1
              ? `${longest * 0.012} ${longest * 0.008}`
              : undefined
          }
        />
      )}
      {points.length >= 2 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={lineW}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      )}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={dotR}
          fill="white"
          stroke="var(--brand)"
          strokeWidth={lineW * 0.6}
        />
      ))}
    </g>
  );
}

function PolygonPreview({
  points,
  cursor,
  longest,
}: {
  points: Point[];
  cursor: Point | null;
  longest: number;
}) {
  if (points.length === 0) return null;
  const all = cursor ? [...points, cursor] : points;
  const lineW = longest * 0.003;
  const dotR = longest * 0.008;
  const showClose = points.length >= 3 && cursor != null;

  return (
    <g pointerEvents="none">
      {points.length >= 2 && (
        <polyline
          points={all.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={lineW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {showClose && (
        <line
          x1={cursor!.x}
          y1={cursor!.y}
          x2={points[0].x}
          y2={points[0].y}
          stroke="var(--brand)"
          strokeWidth={lineW * 0.7}
          strokeDasharray={`${longest * 0.008} ${longest * 0.008}`}
          opacity={0.6}
        />
      )}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={dotR}
          fill="white"
          stroke="var(--brand)"
          strokeWidth={lineW}
        />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Snap indicator
// ---------------------------------------------------------------------------

function SnapIndicator({
  point,
  kind,
  longest,
}: {
  point: Point;
  kind: NonNullable<SnapResult["kind"]>;
  longest: number;
}) {
  const r = longest * 0.012;
  const stroke = longest * 0.003;

  const color =
    kind === "endpoint"
      ? "oklch(0.65 0.18 150)" // green
      : kind === "intersection"
      ? "oklch(0.7 0.18 60)" // amber
      : kind === "ortho"
      ? "oklch(0.65 0.15 200)" // cyan
      : "oklch(0.7 0.02 270)"; // grid: muted

  return (
    <g pointerEvents="none">
      {kind === "endpoint" && (
        <>
          <rect
            x={point.x - r}
            y={point.y - r}
            width={r * 2}
            height={r * 2}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
          />
          <circle cx={point.x} cy={point.y} r={r * 0.3} fill={color} />
        </>
      )}
      {kind === "intersection" && (
        <>
          <line
            x1={point.x - r}
            y1={point.y - r}
            x2={point.x + r}
            y2={point.y + r}
            stroke={color}
            strokeWidth={stroke}
          />
          <line
            x1={point.x - r}
            y1={point.y + r}
            x2={point.x + r}
            y2={point.y - r}
            stroke={color}
            strokeWidth={stroke}
          />
        </>
      )}
      {kind === "ortho" && (
        <circle
          cx={point.x}
          cy={point.y}
          r={r * 0.8}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${r * 0.4} ${r * 0.3}`}
        />
      )}
      {kind === "grid" && (
        <circle cx={point.x} cy={point.y} r={r * 0.35} fill={color} opacity={0.5} />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Grid + draggable node (unchanged)
// ---------------------------------------------------------------------------

function Grid({
  bounds,
  step,
  longest,
}: {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  step: number;
  longest: number;
}) {
  const lines: React.ReactNode[] = [];
  const strokeW = longest * 0.001;
  for (let x = Math.ceil(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
    lines.push(
      <line
        key={`vx-${x}`}
        x1={x}
        y1={bounds.minY}
        x2={x}
        y2={bounds.maxY}
        stroke="oklch(0.85 0.01 270)"
        strokeWidth={strokeW}
      />,
    );
  }
  for (let y = Math.ceil(bounds.minY / step) * step; y <= bounds.maxY; y += step) {
    lines.push(
      <line
        key={`hy-${y}`}
        x1={bounds.minX}
        y1={y}
        x2={bounds.maxX}
        y2={y}
        stroke="oklch(0.85 0.01 270)"
        strokeWidth={strokeW}
      />,
    );
  }
  return <g pointerEvents="none">{lines}</g>;
}

function DraggableNode({
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth,
  draggable,
  cursor,
  onPositionChange,
  onClick,
  onEnter,
  onLeave,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  cursor: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onClick: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  // Non-draggable mode: nothing fancy, just an onClick. Pointer-event drag
  // logic only kicks in when this node is in fact draggable.
  if (!draggable) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ cursor }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      />
    );
  }

  return <DraggableCircle
    cx={cx}
    cy={cy}
    r={r}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    cursor={cursor}
    onPositionChange={onPositionChange}
    onClick={onClick}
    onEnter={onEnter}
    onLeave={onLeave}
  />;
}

function DraggableCircle({
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth,
  cursor,
  onPositionChange,
  onClick,
  onEnter,
  onLeave,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cursor: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onClick: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const startRef = useRef<{
    ptr: { x: number; y: number };
    node: { x: number; y: number };
  } | null>(null);
  const movedRef = useRef(false);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onPointerDown={(e) => {
        e.stopPropagation();
        try {
          (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
        } catch {}
        startRef.current = {
          ptr: { x: e.clientX, y: e.clientY },
          node: { x: cx, y: cy },
        };
        movedRef.current = false;
      }}
      onPointerMove={(e) => {
        if (!startRef.current) return;
        const svg = (e.target as SVGCircleElement).ownerSVGElement;
        if (!svg) return;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cur = pt.matrixTransform(ctm.inverse());
        pt.x = startRef.current.ptr.x;
        pt.y = startRef.current.ptr.y;
        const start = pt.matrixTransform(ctm.inverse());
        const dx = cur.x - start.x;
        const dy = cur.y - start.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) movedRef.current = true;
        onPositionChange({
          x: startRef.current.node.x + dx,
          y: startRef.current.node.y + dy,
        });
      }}
      onPointerUp={(e) => {
        const wasDrag = movedRef.current;
        const had = startRef.current !== null;
        startRef.current = null;
        movedRef.current = false;
        try {
          (e.target as SVGCircleElement).releasePointerCapture(e.pointerId);
        } catch {}
        if (had && !wasDrag) onClick();
      }}
      onPointerCancel={() => {
        startRef.current = null;
        movedRef.current = false;
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
