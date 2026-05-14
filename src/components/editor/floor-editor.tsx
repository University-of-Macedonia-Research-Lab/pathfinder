"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
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
import { DEFAULT_SNAP, type Drawing, type Selected, type SnapState } from "./types";
import { findContainingRoomId } from "@/lib/map/geometry";

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
  floorId: string;
  initial: FloorMap;
};

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export function FloorEditor({ floorId, initial }: Props) {
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
    <>
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
      />
    </>
  );
}
