"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { saveFloorData } from "@/app/dashboard/actions";
import type {
  Door,
  FloorMap,
  GraphEdge,
  GraphNode,
  Point,
  Room,
  WallSegment,
} from "@/lib/map/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolPalette, type Mode, type Tool } from "./tool-palette";
import { EditorSidebar } from "./editor-sidebar";
import { SnapToolbar } from "./snap-toolbar";
import { FloorSwitcher } from "./floor-switcher";
import {
  DEFAULT_SNAP,
  type Drawing,
  type Selected,
  type SiblingFloor,
  type SnapState,
} from "./types";
import { findContainingRoomId } from "@/lib/map/geometry";
import { connectedComponents, normalizeGraph } from "@/lib/map/graph";
import { autoLinkCrossFloor } from "@/lib/map/cross-floor";

const EditorCanvas = dynamic(
  () => import("./editor-canvas").then((m) => m.EditorCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[var(--surface-2)] text-caption">
        Loading editor…
      </div>
    ),
  },
);

type Props = {
  buildingId: string;
  buildingName: string;
  floorId: string;
  initial: FloorMap;
  siblingFloors: SiblingFloor[];
  /** Slim metadata for every floor in this building, used by the in-studio
   *  floor switcher. Includes the current floor. */
  floorList: { id: string; slug: string; level: number; nameEn: string }[];
};

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export function FloorEditor({
  buildingId,
  buildingName,
  floorId,
  initial,
  siblingFloors,
  floorList,
}: Props) {
  const [floor, setFloor] = useState<FloorMap>(initial);
  const [mode, setMode] = useState<Mode>("structure");
  const [tool, setTool] = useState<Tool>("select");
  const [drawing, setDrawing] = useState<Drawing>({ kind: "none" });
  const [selected, setSelected] = useState<Selected>(null);
  const [snap, setSnap] = useState<SnapState>(DEFAULT_SNAP);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef<string>(JSON.stringify(initial));

  useEffect(() => {
    setDirty(JSON.stringify(floor) !== lastSavedRef.current);
  }, [floor]);

  useEffect(() => {
    function onBefore(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  const changeMode = useCallback((m: Mode) => {
    setMode(m);
    setTool("select");
    setDrawing({ kind: "none" });
    setSelected(null);
  }, []);

  const changeTool = useCallback((t: Tool) => {
    setTool(t);
    setDrawing({ kind: "none" });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveFloorData(floorId, floor);
      lastSavedRef.current = JSON.stringify(floor);
      setDirty(false);
      toast.success("Saved");
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }, [floor, floorId]);

  // -------------------------------------------------------------------------
  // Canvas event dispatch.
  //
  // Every tool routes through one of two callbacks: onCanvasClick (a click on
  // empty space) or onEntityClick (a click on an existing item). The handlers
  // below decide what that click means based on the active tool and the
  // current drawing state.
  // -------------------------------------------------------------------------

  const handleCanvasClick = useCallback(
    (pos: Point) => {
      switch (tool) {
        case "wall":
        case "exterior-wall":
        case "window": {
          const wk =
            tool === "exterior-wall"
              ? "exterior"
              : tool === "window"
              ? "window"
              : "interior";
          // Multi-segment polyline: each click extends the chain; commit on
          // double-click or Enter. Segments share the wallKind.
          if (drawing.kind === "wall" && drawing.wallKind === wk) {
            setDrawing({ ...drawing, points: [...drawing.points, pos] });
          } else {
            setDrawing({ kind: "wall", points: [pos], wallKind: wk });
          }
          return;
        }
        case "door": {
          const door: Door = {
            id: id("d"),
            between: ["", ""],
            position: pos,
            features: [],
          };
          setFloor((f) => ({ ...f, doors: [...f.doors, door] }));
          setSelected({ kind: "door", id: door.id });
          return;
        }
        case "polygon": {
          if (drawing.kind === "polygon") {
            setDrawing({ kind: "polygon", points: [...drawing.points, pos] });
          } else {
            setDrawing({ kind: "polygon", points: [pos] });
          }
          return;
        }
        case "drawGraph": {
          // If endpoint-snap brought the cursor exactly onto an existing
          // node, reference that node instead of creating a duplicate.
          const onNode = floor.nodes.find(
            (n) =>
              Math.abs(n.position.x - pos.x) < 0.5 &&
              Math.abs(n.position.y - pos.y) < 0.5,
          );
          const newPoint = onNode
            ? { point: onNode.position, nodeId: onNode.id }
            : { point: pos };
          if (drawing.kind === "graphLine") {
            setDrawing({
              kind: "graphLine",
              points: [...drawing.points, newPoint],
            });
          } else {
            setDrawing({ kind: "graphLine", points: [newPoint] });
          }
          return;
        }
        case "select":
        case "delete":
          // No-op on empty-canvas click for these tools. We can't reliably
          // distinguish "click on empty space" from "click on an entity that
          // also bubbled up to the canvas" — Leaflet's click fires from the
          // native event bubble while entity handlers fire from React's
          // synthetic delegate, and the order isn't stable across browsers.
          // Use Esc to cancel an in-progress edge or to deselect.
          return;
      }
    },
    [tool, drawing, floor.nodes],
  );

  // Normalize the graph: collapse near-duplicate nodes and bridge close-
  // but-disconnected components. Defaults are tuned to the floor's size —
  // merge threshold is small (basically duplicates) and bridge threshold
  // is 3% of the longest bound side.
  const normalize = useCallback(() => {
    setFloor((f) => {
      const longest = Math.max(
        f.bounds.maxX - f.bounds.minX,
        f.bounds.maxY - f.bounds.minY,
      );
      const merge = 0.5;
      const bridge = Math.max(2, longest * 0.03);
      // connectAll forces a single connected graph by adding the minimum-
      // distance edge between any two disconnected components, repeating
      // until everything is one component. That's the user's intent when
      // they hit "Normalize" — they want one routable graph.
      const result = normalizeGraph(f, merge, bridge, { connectAll: true });
      if (
        result.mergedNodes === 0 &&
        result.splitEdges === 0 &&
        result.bridgesAdded === 0 &&
        result.forcedBridges === 0
      ) {
        toast.info("Graph is already one component.");
        return f;
      }
      const bits: string[] = [];
      if (result.mergedNodes > 0)
        bits.push(`merged ${result.mergedNodes} duplicate node${result.mergedNodes === 1 ? "" : "s"}`);
      if (result.splitEdges > 0)
        bits.push(`split ${result.splitEdges} edge${result.splitEdges === 1 ? "" : "s"} through intermediate nodes`);
      if (result.bridgesAdded > 0)
        bits.push(`bridged ${result.bridgesAdded} close component${result.bridgesAdded === 1 ? "" : "s"}`);
      if (result.forcedBridges > 0)
        bits.push(`force-linked ${result.forcedBridges} distant component${result.forcedBridges === 1 ? "" : "s"}`);
      bits.push(
        `${result.componentsBefore} → ${result.componentsAfter} component${result.componentsAfter === 1 ? "" : "s"}`,
      );
      toast.success(`Normalized: ${bits.join(" · ")}`);
      return result.map;
    });
  }, []);

  // Auto-link elevator_shaft / stairwell rooms to their counterparts on
  // sibling floors — sets connectsToFloor + features on the in-room node.
  // One-sided: needs to be run on each floor for bidirectional traversal.
  const autoLinkFloors = useCallback(() => {
    setFloor((f) => {
      const result = autoLinkCrossFloor(f, siblingFloors);
      if (
        result.linksAdded === 0 &&
        result.linksAlreadyPresent === 0 &&
        result.skipped.length === 0
      ) {
        toast.info(
          "No stairwell or elevator_shaft rooms on this floor to link.",
        );
        return f;
      }
      if (
        result.linksAdded === 0 &&
        result.linksAlreadyPresent > 0 &&
        result.skipped.length === 0
      ) {
        toast.info("Cross-floor links are already in place.");
        return f;
      }
      const bits: string[] = [];
      if (result.linksAdded > 0)
        bits.push(`Linked ${result.linksAdded} node${result.linksAdded === 1 ? "" : "s"}`);
      if (result.linksAlreadyPresent > 0)
        bits.push(`${result.linksAlreadyPresent} already linked`);
      if (result.skipped.length > 0)
        bits.push(`${result.skipped.length} skipped`);
      const note =
        result.skipped.length > 0
          ? ` First skip: ${result.skipped[0].roomLabel} — ${result.skipped[0].reason}.`
          : "";
      const reminder =
        result.linksAdded > 0
          ? " Re-run on the other floor for bidirectional traversal."
          : "";
      toast.success(`${bits.join(" · ")}.${reminder}${note}`);
      return result.map;
    });
  }, [siblingFloors]);

  // Auto-assign every node to whichever room polygon contains its position.
  // Nodes outside any room (corridors, lobbies) are left untouched. Idempotent.
  const autoAssignRooms = useCallback(() => {
    setFloor((f) => {
      let changed = 0;
      const nextNodes = f.nodes.map((n) => {
        const roomId = findContainingRoomId(n.position, f.rooms);
        if (roomId && n.roomId !== roomId) {
          changed++;
          return { ...n, roomId };
        }
        return n;
      });
      if (changed === 0) {
        toast.info("All nodes inside rooms are already linked.");
        return f;
      }
      toast.success(`Linked ${changed} node${changed === 1 ? "" : "s"} to rooms.`);
      return { ...f, nodes: nextNodes };
    });
  }, []);

  const deleteEntity = useCallback((s: NonNullable<Selected>) => {
    setFloor((f) => {
      switch (s.kind) {
        case "node":
          return {
            ...f,
            nodes: f.nodes.filter((n) => n.id !== s.id),
            edges: f.edges.filter((e) => e.from !== s.id && e.to !== s.id),
          };
        case "edge":
          return { ...f, edges: f.edges.filter((e) => e.id !== s.id) };
        case "wall":
          return { ...f, walls: f.walls.filter((w) => w.id !== s.id) };
        case "door":
          return { ...f, doors: f.doors.filter((d) => d.id !== s.id) };
        case "room":
          return { ...f, rooms: f.rooms.filter((r) => r.id !== s.id) };
      }
    });
    setSelected(null);
  }, []);

  const handleEntityClick = useCallback(
    (s: NonNullable<Selected>) => {
      if (tool === "delete") {
        deleteEntity(s);
        return;
      }

      if (tool === "drawGraph" && s.kind === "node") {
        // Clicking an existing node while drawing a graph polyline extends
        // the chain from that node — no duplicate is created.
        const node = floor.nodes.find((n) => n.id === s.id);
        if (!node) return;
        const newPoint = { point: node.position, nodeId: s.id };
        setDrawing((d) =>
          d.kind === "graphLine"
            ? { ...d, points: [...d.points, newPoint] }
            : { kind: "graphLine", points: [newPoint] },
        );
        return;
      }

      // Default: select.
      setSelected(s);
    },
    [tool, drawing, floor.nodes, deleteEntity],
  );

  const handleNodeDrag = useCallback((nodeId: string, pos: Point) => {
    setFloor((f) => ({
      ...f,
      nodes: f.nodes.map((n) => (n.id === nodeId ? { ...n, position: pos } : n)),
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------
  const commitPolygon = useCallback(() => {
    if (drawing.kind !== "polygon" || drawing.points.length < 3) return;
    const room: Room = {
      id: id("r"),
      kind: "other",
      name: { en: `Room ${floor.rooms.length + 1}`, el: `Δωμάτιο ${floor.rooms.length + 1}` },
      polygon: drawing.points,
    };
    setFloor((f) => ({ ...f, rooms: [...f.rooms, room] }));
    setDrawing({ kind: "none" });
    setSelected({ kind: "room", id: room.id });
  }, [drawing, floor.rooms.length]);

  const commitWall = useCallback(() => {
    if (drawing.kind !== "wall" || drawing.points.length < 2) {
      setDrawing({ kind: "none" });
      return;
    }
    const newWalls: WallSegment[] = [];
    for (let i = 0; i < drawing.points.length - 1; i++) {
      newWalls.push({
        id: id("w"),
        start: drawing.points[i],
        end: drawing.points[i + 1],
        kind: drawing.wallKind,
      });
    }
    setFloor((f) => ({ ...f, walls: [...f.walls, ...newWalls] }));
    setDrawing({ kind: "none" });
  }, [drawing]);

  const commitGraphLine = useCallback(() => {
    if (drawing.kind !== "graphLine" || drawing.points.length === 0) {
      setDrawing({ kind: "none" });
      return;
    }
    // Resolve each polyline point to a node id, creating new nodes for
    // points that don't already reference an existing node.
    const newNodes: GraphNode[] = [];
    const nodeIds: string[] = [];
    for (const p of drawing.points) {
      if (p.nodeId) {
        nodeIds.push(p.nodeId);
      } else {
        // Auto-assign the new node to the room polygon it falls inside, so
        // the user doesn't have to set it manually after drawing.
        const roomId = findContainingRoomId(p.point, floor.rooms) ?? undefined;
        const n: GraphNode = {
          id: id("n"),
          position: p.point,
          features: [],
          ...(roomId ? { roomId } : {}),
        };
        newNodes.push(n);
        nodeIds.push(n.id);
      }
    }
    // Emit one edge per consecutive pair; skip degenerate self-loops.
    const newEdges: GraphEdge[] = [];
    for (let i = 0; i < nodeIds.length - 1; i++) {
      if (nodeIds[i] === nodeIds[i + 1]) continue;
      newEdges.push({
        id: id("e"),
        from: nodeIds[i],
        to: nodeIds[i + 1],
        features: [],
      });
    }
    setFloor((f) => ({
      ...f,
      nodes: [...f.nodes, ...newNodes],
      edges: [...f.edges, ...newEdges],
    }));
    setDrawing({ kind: "none" });
    // Select the first new node so the user can immediately edit features.
    if (newNodes[0]) setSelected({ kind: "node", id: newNodes[0].id });
    else if (nodeIds[0]) setSelected({ kind: "node", id: nodeIds[0] });
  }, [drawing, floor.rooms]);

  const commitActive = useCallback(() => {
    if (drawing.kind === "polygon") commitPolygon();
    else if (drawing.kind === "wall") commitWall();
    else if (drawing.kind === "graphLine") commitGraphLine();
  }, [drawing, commitPolygon, commitWall, commitGraphLine]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawing({ kind: "none" });
        setSelected(null);
        return;
      }
      if (
        e.key === "Enter" &&
        (drawing.kind === "polygon" ||
          drawing.kind === "wall" ||
          drawing.kind === "graphLine")
      ) {
        e.preventDefault();
        commitActive();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        // Don't intercept if the user is typing in a form input.
        const t = e.target as HTMLElement | null;
        if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        e.preventDefault();
        deleteEntity(selected);
        return;
      }
      if ((e.key === "s" || e.key === "S") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing, selected, commitActive, deleteEntity, handleSave]);

  // -------------------------------------------------------------------------
  // Stats + status line
  // -------------------------------------------------------------------------
  const stats = useMemo(
    () => ({
      rooms: floor.rooms.length,
      walls: floor.walls.length,
      doors: floor.doors.length,
      nodes: floor.nodes.length,
      edges: floor.edges.length,
      components: connectedComponents(floor.nodes, floor.edges).length,
    }),
    [floor],
  );

  const drawingHint = useMemo(() => {
    if (drawing.kind === "wall") {
      const n = drawing.points.length;
      return `${n} point${n === 1 ? "" : "s"} placed · double-click / Enter to finish · Esc cancels`;
    }
    if (drawing.kind === "polygon")
      return `${drawing.points.length} point${drawing.points.length === 1 ? "" : "s"} placed · Enter to close (need ≥3) · Esc cancels`;
    if (drawing.kind === "graphLine") {
      const n = drawing.points.length;
      const reused = drawing.points.filter((p) => p.nodeId).length;
      return `${n} point${n === 1 ? "" : "s"}${reused ? ` (${reused} on existing nodes)` : ""} · double-click / Enter to finish · Esc cancels`;
    }
    return null;
  }, [drawing]);

  return (
    <div className="flex h-full flex-col">
      {/* Studio header — replaces the slim breadcrumb that used to live in
          the server page. Holds the back arrow, the building name, and an
          in-studio floor switcher so the user can hop floors without
          leaving the editor. The switcher reads `dirty` from this scope
          and prompts before discarding work. */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-caption">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
            aria-label="All buildings"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/dashboard/buildings/${buildingId}`}
            className="truncate hover:text-foreground"
          >
            {buildingName}
          </Link>
          <span className="text-muted-foreground">/</span>
          <FloorSwitcher
            buildingId={buildingId}
            currentFloorId={floorId}
            floors={floorList}
            dirty={dirty}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <ToolPalette
          mode={mode}
          tool={tool}
          onModeChange={changeMode}
          onToolChange={changeTool}
        />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="text-caption">
            {stats.rooms} rooms · {stats.walls} walls · {stats.doors} doors ·{" "}
            <b>{stats.nodes} nodes</b> · <b>{stats.edges} edges</b>
            {stats.nodes > 0 && stats.components > 1 && (
              <span
                className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                title="The graph is split into multiple disconnected components — routes between them will fail."
              >
                {stats.components} disconnected components
              </span>
            )}
            {drawingHint && (
              <span className="ml-3 text-[var(--brand)]">{drawingHint}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SnapToolbar snap={snap} onChange={setSnap} />
            <Button
              size="sm"
              variant="outline"
              onClick={autoAssignRooms}
              title="Assign every node to the room polygon containing it"
            >
              Auto-assign rooms
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={autoLinkFloors}
              title="Wire stairwell / elevator_shaft rooms to their counterparts on other floors (match by code)"
            >
              Link stairs / elevators
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={normalize}
              title="Merge duplicate nodes and bridge close-but-disconnected components into a single graph"
            >
              Normalize
            </Button>
            <span
              className={cn(
                "text-caption",
                dirty ? "text-amber-600" : "text-muted-foreground",
              )}
            >
              {saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}
            </span>
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
              Save
            </Button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1">
          <EditorCanvas
            map={floor}
            mode={mode}
            tool={tool}
            drawing={drawing}
            selected={selected}
            snap={snap}
            siblingFloors={siblingFloors}
            onCanvasClick={handleCanvasClick}
            onEntityClick={handleEntityClick}
            onCommitDrawing={commitActive}
            onNodeDrag={handleNodeDrag}
          />
        </div>
      </div>
      <EditorSidebar
        mode={mode}
        floor={floor}
        floorId={floorId}
        siblingFloors={siblingFloors}
        selected={selected}
        onSelect={setSelected}
        onUpdateNode={(id, patch) =>
          setFloor((f) => ({
            ...f,
            nodes: f.nodes.map((n) => (n.id === id ? ({ ...n, ...patch } as GraphNode) : n)),
          }))
        }
        onUpdateEdge={(id, patch) =>
          setFloor((f) => ({
            ...f,
            edges: f.edges.map((e) => (e.id === id ? ({ ...e, ...patch } as GraphEdge) : e)),
          }))
        }
        onUpdateWall={(id, patch) =>
          setFloor((f) => ({
            ...f,
            walls: f.walls.map((w) => (w.id === id ? ({ ...w, ...patch } as WallSegment) : w)),
          }))
        }
        onUpdateDoor={(id, patch) =>
          setFloor((f) => ({
            ...f,
            doors: f.doors.map((d) => (d.id === id ? ({ ...d, ...patch } as Door) : d)),
          }))
        }
        onUpdateRoom={(id, patch) =>
          setFloor((f) => ({
            ...f,
            rooms: f.rooms.map((r) => (r.id === id ? ({ ...r, ...patch } as Room) : r)),
          }))
        }
        onUpdateBounds={(bounds) => setFloor((f) => ({ ...f, bounds }))}
        onUpdateGrid={(grid) =>
          setFloor((f) => ({ ...f, grid: grid ?? undefined }))
        }
        onUpdateBackground={(background) =>
          setFloor((f) => ({ ...f, background: background ?? undefined }))
        }
      />
      </div>
    </div>
  );
}
