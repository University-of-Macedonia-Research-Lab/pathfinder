"use client";

import type {
  AccessibilityFeature,
  Background,
  Door,
  FloorMap,
  Grid,
  GraphEdge,
  GraphNode,
  Room,
  RoomKind,
  WallSegment,
} from "@/lib/map/schema";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Mode } from "./tool-palette";
import type { Selected, SiblingFloor } from "./types";

const FEATURES: AccessibilityFeature[] = [
  "elevator",
  "stairs",
  "ramp",
  "wheelchair_lift",
  "accessible_bathroom",
  "bathroom",
  "automatic_door",
  "narrow_passage",
  "step",
];

const ROOM_KINDS: RoomKind[] = [
  "classroom",
  "office",
  "lab",
  "lecture_hall",
  "bathroom",
  "stairwell",
  "elevator_shaft",
  "corridor",
  "entrance",
  "outdoor",
  "other",
];

const WALL_KINDS: WallSegment["kind"][] = ["interior", "exterior", "window"];

type Props = {
  mode: Mode;
  floor: FloorMap;
  floorId: string;
  siblingFloors: SiblingFloor[];
  selected: Selected;
  onSelect: (s: Selected) => void;
  onUpdateNode: (id: string, patch: Partial<GraphNode>) => void;
  onUpdateEdge: (id: string, patch: Partial<GraphEdge>) => void;
  onUpdateWall: (id: string, patch: Partial<WallSegment>) => void;
  onUpdateDoor: (id: string, patch: Partial<Door>) => void;
  onUpdateRoom: (id: string, patch: Partial<Room>) => void;
  onUpdateBounds: (b: FloorMap["bounds"]) => void;
  onUpdateGrid: (g: Grid | undefined) => void;
  onUpdateBackground: (b: Background | undefined) => void;
};

const BOUNDS_PRESETS = [
  { label: "100×100", w: 100, h: 100 },
  { label: "200×200", w: 200, h: 200 },
  { label: "400×400", w: 400, h: 400 },
  { label: "800×600", w: 800, h: 600 },
];

export function EditorSidebar(props: Props) {
  const { mode, floor, selected, onSelect } = props;
  return (
    <aside className="flex w-80 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
      {/* Selected entity editor — pinned at the top so it's the first thing
          the user sees after clicking something, and never gets pushed
          below the fold by the (tall) Canvas panel. */}
      {selected?.kind === "node" && (
        <SelectedHeader label={`Node · ${selected.id}`} onClear={() => onSelect(null)}>
          <NodeEditor
            node={floor.nodes.find((n) => n.id === selected.id)!}
            rooms={floor.rooms}
            siblingFloors={props.siblingFloors}
            onChange={(patch) => props.onUpdateNode(selected.id, patch)}
          />
        </SelectedHeader>
      )}
      {selected?.kind === "edge" && (
        <SelectedHeader label="Edge" onClear={() => onSelect(null)}>
          <EdgeEditor
            edge={floor.edges.find((e) => e.id === selected.id)!}
            onChange={(patch) => props.onUpdateEdge(selected.id, patch)}
          />
        </SelectedHeader>
      )}
      {selected?.kind === "wall" && (
        <SelectedHeader label="Wall" onClear={() => onSelect(null)}>
          <WallEditor
            wall={floor.walls.find((w) => w.id === selected.id)!}
            onChange={(patch) => props.onUpdateWall(selected.id, patch)}
          />
        </SelectedHeader>
      )}
      {selected?.kind === "door" && (
        <SelectedHeader label="Door" onClear={() => onSelect(null)}>
          <DoorEditor
            door={floor.doors.find((d) => d.id === selected.id)!}
            rooms={floor.rooms}
            onChange={(patch) => props.onUpdateDoor(selected.id, patch)}
          />
        </SelectedHeader>
      )}
      {selected?.kind === "room" && (
        <SelectedHeader
          label={`Room · ${floor.rooms.find((r) => r.id === selected.id)?.name.en ?? ""}`}
          onClear={() => onSelect(null)}
        >
          <RoomEditor
            room={floor.rooms.find((r) => r.id === selected.id)!}
            onChange={(patch) => props.onUpdateRoom(selected.id, patch)}
          />
        </SelectedHeader>
      )}

      <CanvasPanel
        floor={floor}
        floorId={props.floorId}
        onUpdateBounds={props.onUpdateBounds}
        onUpdateGrid={props.onUpdateGrid}
        onUpdateBackground={props.onUpdateBackground}
      />

      {/* Per-mode lists */}
      {mode === "structure" && (
        <>
          <EntityList
            title={`Walls (${floor.walls.length})`}
            empty="No walls yet. Pick a wall tool and click two points."
            items={floor.walls.map((w) => ({
              id: w.id,
              label: `${w.kind} · (${w.start.x.toFixed(0)},${w.start.y.toFixed(0)}) → (${w.end.x.toFixed(0)},${w.end.y.toFixed(0)})`,
            }))}
            selected={selected?.kind === "wall" ? selected.id : null}
            onSelect={(id) => onSelect({ kind: "wall", id })}
          />
          <EntityList
            title={`Doors (${floor.doors.length})`}
            empty="No doors yet."
            items={floor.doors.map((d) => ({
              id: d.id,
              label: `(${d.position.x.toFixed(0)},${d.position.y.toFixed(0)})`,
            }))}
            selected={selected?.kind === "door" ? selected.id : null}
            onSelect={(id) => onSelect({ kind: "door", id })}
          />
        </>
      )}

      {mode === "rooms" && (
        <EntityList
          title={`Rooms (${floor.rooms.length})`}
          empty="No rooms yet. Pick the Room tool, click points, then press Enter."
          items={floor.rooms.map((r) => ({
            id: r.id,
            label: `${r.code ? r.code + " · " : ""}${r.name.en} (${r.kind})`,
          }))}
          selected={selected?.kind === "room" ? selected.id : null}
          onSelect={(id) => onSelect({ kind: "room", id })}
        />
      )}

      {mode === "graph" && (
        <>
          <CrossFloorLinks
            floor={floor}
            siblingFloors={props.siblingFloors}
            selected={selected}
            onSelect={onSelect}
          />
          <EntityList
            title={`Nodes (${floor.nodes.length})`}
            empty="No nodes yet."
            items={floor.nodes.map((n) => ({
              id: n.id,
              label: `${n.id}  (${n.position.x.toFixed(0)},${n.position.y.toFixed(0)})`,
            }))}
            selected={selected?.kind === "node" ? selected.id : null}
            onSelect={(id) => onSelect({ kind: "node", id })}
          />
          <EntityList
            title={`Edges (${floor.edges.length})`}
            empty="No edges yet."
            items={floor.edges.map((e) => ({
              id: e.id,
              label: `${e.from} → ${e.to}`,
            }))}
            selected={selected?.kind === "edge" ? selected.id : null}
            onSelect={(id) => onSelect({ kind: "edge", id })}
          />
        </>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------

function SelectedHeader({
  label,
  onClear,
  children,
}: {
  label: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--brand)] bg-[color:color-mix(in_oklab,var(--brand-soft),transparent_60%)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="truncate text-overline text-[color:var(--brand)]">{label}</div>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-muted-foreground hover:underline"
        >
          deselect
        </button>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function CrossFloorLinks({
  floor,
  siblingFloors,
  selected,
  onSelect,
}: {
  floor: FloorMap;
  siblingFloors: SiblingFloor[];
  selected: Selected;
  onSelect: (s: Selected) => void;
}) {
  const linked = floor.nodes.filter((n) => n.connectsToFloor);
  return (
    <Section title={`Cross-floor links (${linked.length})`}>
      {linked.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          No nodes on this floor link to another. Select a stair/elevator node and use
          the “Connects to (another floor)” picker to wire one up.
        </p>
      ) : (
        <ul className="flex flex-col gap-1 text-xs">
          {linked.map((n) => {
            const link = n.connectsToFloor!;
            const target = siblingFloors.find((f) => f.slug === link.floorSlug);
            const targetNode = target?.nodes.find((nn) => nn.id === link.nodeId);
            const reciprocal =
              targetNode?.connectsToFloor?.floorSlug === floor.floorSlug &&
              targetNode?.connectsToFloor?.nodeId === n.id;
            const room = n.roomId
              ? floor.rooms.find((r) => r.id === n.roomId)
              : null;
            const isSelected =
              selected?.kind === "node" && selected.id === n.id;
            const summary = target
              ? `→ L${target.level} · ${target.nameEn}`
              : `→ unknown floor (${link.floorSlug})`;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "node", id: n.id })}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left",
                    isSelected
                      ? "bg-[var(--brand-soft)]"
                      : "hover:bg-secondary",
                  )}
                >
                  <span className="font-mono">
                    {n.id}
                    {room ? (
                      <span className="text-muted-foreground">
                        {" "}· {room.code ?? room.name.en}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {summary}{" "}
                    {target && targetNode ? (
                      reciprocal ? (
                        <span className="text-emerald-700 dark:text-emerald-300">
                          · bidirectional
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300">
                          · one-way (no reverse link)
                        </span>
                      )
                    ) : !target ? (
                      <span className="text-destructive">· broken</span>
                    ) : (
                      <span className="text-destructive">
                        · target node missing
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-overline text-muted-foreground">{title}</div>
      {children}
    </section>
  );
}

function EntityList({
  title,
  empty,
  items,
  selected,
  onSelect,
}: {
  title: string;
  empty: string;
  items: { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Section title={title}>
      <ul className="flex flex-col gap-1 text-xs">
        {items.length === 0 ? (
          <li className="text-muted-foreground">{empty}</li>
        ) : (
          items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onSelect(it.id)}
                className={cn(
                  "w-full truncate rounded px-2 py-1 text-left font-mono",
                  selected === it.id
                    ? "bg-[var(--brand-soft)]"
                    : "hover:bg-secondary",
                )}
              >
                {it.label}
              </button>
            </li>
          ))
        )}
      </ul>
    </Section>
  );
}

function NodeEditor({
  node,
  rooms,
  siblingFloors,
  onChange,
}: {
  node: GraphNode;
  rooms: Room[];
  siblingFloors: SiblingFloor[];
  onChange: (patch: Partial<GraphNode>) => void;
}) {
  const link = node.connectsToFloor;
  return (
    <Section title={`Node ${node.id}`}>
      <PositionRow
        x={node.position.x}
        y={node.position.y}
        onChange={(position) => onChange({ position })}
      />
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Room</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={node.roomId ?? ""}
          onChange={(e) =>
            onChange({ roomId: e.target.value === "" ? undefined : e.target.value })
          }
        >
          <option value="">— none —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.code ? `${r.code} · ` : ""}{r.name.en}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-muted-foreground">
          Required for room-to-room routing — a route to a room uses its first associated node.
        </span>
      </label>

      {/* Cross-floor link — typically used on the node at the top of a
          flight of stairs (or in an elevator) to point at the node on
          another floor that you'd step into. Pathfinder uses this to walk
          across floors; without it routes can't leave the current level. */}
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Connects to (another floor)</span>
          {link && (
            <button
              type="button"
              onClick={() => onChange({ connectsToFloor: undefined })}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              clear
            </button>
          )}
        </div>
        {siblingFloors.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">
            No other floors in this building yet — add a second floor to enable cross-floor links.
          </span>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={link?.floorSlug ?? ""}
              onChange={(e) => {
                const floorSlug = e.target.value;
                if (!floorSlug) {
                  onChange({ connectsToFloor: undefined });
                  return;
                }
                // Pick the first node on that floor as a sensible default
                // so the link is immediately valid; user can refine below.
                const sib = siblingFloors.find((f) => f.slug === floorSlug);
                const defaultNode = sib?.nodes[0]?.id ?? "";
                onChange({
                  connectsToFloor: defaultNode
                    ? { floorSlug, nodeId: defaultNode }
                    : undefined,
                });
              }}
            >
              <option value="">— floor —</option>
              {siblingFloors.map((f) => (
                <option key={f.slug} value={f.slug}>
                  L{f.level} · {f.nameEn}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
              disabled={!link?.floorSlug}
              value={link?.nodeId ?? ""}
              onChange={(e) => {
                if (!link?.floorSlug) return;
                onChange({
                  connectsToFloor: { floorSlug: link.floorSlug, nodeId: e.target.value },
                });
              }}
            >
              <option value="">— node —</option>
              {(siblingFloors.find((f) => f.slug === link?.floorSlug)?.nodes ?? []).map(
                (n) => {
                  const room =
                    n.roomId &&
                    siblingFloors
                      .find((f) => f.slug === link?.floorSlug)
                      ?.rooms.find((r) => r.id === n.roomId);
                  const label = room
                    ? `${n.id} · ${room.code ?? room.nameEn}`
                    : n.id;
                  return (
                    <option key={n.id} value={n.id}>
                      {label}
                    </option>
                  );
                },
              )}
            </select>
          </div>
        )}
        <span className="text-[11px] text-muted-foreground">
          Used by stairs / elevators. Add the same link in reverse on the other
          floor for bidirectional traversal.
        </span>
      </div>

      <FeatureToggles value={node.features} onChange={(features) => onChange({ features })} />
    </Section>
  );
}

function EdgeEditor({
  edge,
  onChange,
}: {
  edge: GraphEdge;
  onChange: (patch: Partial<GraphEdge>) => void;
}) {
  return (
    <Section title={`Edge ${edge.from} → ${edge.to}`}>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Cost (blank = euclidean)</span>
        <Input
          type="number"
          step="0.1"
          value={edge.cost ?? ""}
          placeholder="auto"
          onChange={(e) => {
            const v = e.target.value;
            onChange({ cost: v === "" ? undefined : Number(v) });
          }}
        />
      </label>
      <FeatureToggles value={edge.features} onChange={(features) => onChange({ features })} />
    </Section>
  );
}

function WallEditor({
  wall,
  onChange,
}: {
  wall: WallSegment;
  onChange: (patch: Partial<WallSegment>) => void;
}) {
  return (
    <Section title="Wall">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Kind</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={wall.kind}
          onChange={(e) => onChange({ kind: e.target.value as WallSegment["kind"] })}
        >
          {WALL_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <PointInput
          label="start"
          value={wall.start}
          onChange={(start) => onChange({ start })}
        />
        <PointInput
          label="end"
          value={wall.end}
          onChange={(end) => onChange({ end })}
        />
      </div>
    </Section>
  );
}

function DoorEditor({
  door,
  rooms,
  onChange,
}: {
  door: Door;
  rooms: Room[];
  onChange: (patch: Partial<Door>) => void;
}) {
  return (
    <Section title="Door">
      <PositionRow
        x={door.position.x}
        y={door.position.y}
        onChange={(position) => onChange({ position })}
      />
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[0, 1].map((i) => (
          <label key={i} className="flex flex-col gap-1">
            <span className="text-muted-foreground">{i === 0 ? "Room A" : "Room B"}</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={door.between[i]}
              onChange={(e) => {
                const next = [...door.between] as [string, string];
                next[i] = e.target.value;
                onChange({ between: next });
              }}
            >
              <option value="">— none —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code ? `${r.code} · ` : ""}{r.name.en}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <FeatureToggles value={door.features} onChange={(features) => onChange({ features })} />
    </Section>
  );
}

function RoomEditor({
  room,
  onChange,
}: {
  room: Room;
  onChange: (patch: Partial<Room>) => void;
}) {
  return (
    <Section title="Room">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Code</span>
        <Input
          value={room.code ?? ""}
          placeholder="e.g. 404, ΙΣ16"
          onChange={(e) => onChange({ code: e.target.value || undefined })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Name (English)</span>
        <Input
          value={room.name.en}
          onChange={(e) => onChange({ name: { ...room.name, en: e.target.value } })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Name (Greek)</span>
        <Input
          value={room.name.el}
          onChange={(e) => onChange({ name: { ...room.name, el: e.target.value } })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Kind</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={room.kind}
          onChange={(e) => onChange({ kind: e.target.value as RoomKind })}
        >
          {ROOM_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <div className="text-xs text-muted-foreground">
        {room.polygon.length} vertices. Redraw the room to change its shape.
      </div>
    </Section>
  );
}

function PositionRow({
  x,
  y,
  onChange,
}: {
  x: number;
  y: number;
  onChange: (p: { x: number; y: number }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">x</span>
        <Input type="number" value={x} onChange={(e) => onChange({ x: Number(e.target.value), y })} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">y</span>
        <Input type="number" value={y} onChange={(e) => onChange({ x, y: Number(e.target.value) })} />
      </label>
    </div>
  );
}

function PointInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { x: number; y: number };
  onChange: (p: { x: number; y: number }) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <div className="grid grid-cols-2 gap-1">
        <Input
          type="number"
          value={value.x}
          onChange={(e) => onChange({ x: Number(e.target.value), y: value.y })}
        />
        <Input
          type="number"
          value={value.y}
          onChange={(e) => onChange({ x: value.x, y: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

function FeatureToggles({
  value,
  onChange,
}: {
  value: AccessibilityFeature[];
  onChange: (v: AccessibilityFeature[]) => void;
}) {
  const set = new Set(value);
  return (
    <div className="flex flex-wrap gap-1">
      {FEATURES.map((f) => {
        const on = set.has(f);
        return (
          <button
            key={f}
            type="button"
            onClick={() => {
              const next = new Set(set);
              if (on) next.delete(f);
              else next.add(f);
              onChange(Array.from(next));
            }}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
              on
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--accent-foreground)]"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas panel: bounds + presets, grid step + subdivisions, background image
// ---------------------------------------------------------------------------

function defaultGridStep(bounds: FloorMap["bounds"]): number {
  const longest = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
  );
  return Math.max(1, Math.round(longest / 20));
}

function CanvasPanel({
  floor,
  floorId,
  onUpdateBounds,
  onUpdateGrid,
  onUpdateBackground,
}: {
  floor: FloorMap;
  floorId: string;
  onUpdateBounds: (b: FloorMap["bounds"]) => void;
  onUpdateGrid: (g: Grid | undefined) => void;
  onUpdateBackground: (b: Background | undefined) => void;
}) {
  const grid: Grid = floor.grid ?? {
    step: defaultGridStep(floor.bounds),
    subdivisions: 4,
  };
  const bg = floor.background;

  function applyPreset(w: number, h: number) {
    onUpdateBounds({ minX: 0, minY: 0, maxX: w, maxY: h });
  }

  async function onPickImage(file: File) {
    // Two-step upload — never put the bytes in a server-action payload.
    //
    // 1. Ask the API for a presigned PUT URL targeted at DO Spaces. The
    //    endpoint returns 503 if Spaces isn't configured, in which case
    //    we fall back to a multipart upload to the API which stores the
    //    bytes in the FloorAsset DB table.
    // 2. Either PUT the file directly to Spaces, or POST it to the API.
    //
    // The save action then only carries a URL string.
    let url: string | null = null;
    try {
      const presignRes = await fetch(`/api/floors/${floorId}/assets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          size: file.size,
        }),
      });
      if (presignRes.ok) {
        const data = (await presignRes.json()) as {
          mode: "presigned";
          signedUrl: string;
          publicUrl: string;
          requiredHeaders?: Record<string, string>;
        };
        // Echo back whatever headers the signer baked into the signature
        // (Content-Type + x-amz-acl), otherwise Spaces rejects with a
        // signature mismatch and the public URL ends up returning 403.
        const headers = { ...(data.requiredHeaders ?? { "content-type": file.type }) };
        const putRes = await fetch(data.signedUrl, {
          method: "PUT",
          headers,
          body: file,
        });
        if (!putRes.ok) throw new Error(`spaces_put_${putRes.status}`);
        url = data.publicUrl;
      } else if (presignRes.status !== 503) {
        // Real error — surface it. 503 just means "Spaces unconfigured,
        // try the multipart fallback instead".
        const data = (await presignRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? presignRes.statusText);
      }
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : "unknown"}`);
      return;
    }

    if (!url) {
      // Fallback: multipart to the API, bytes stored in the DB.
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/floors/${floorId}/assets`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(`Upload failed: ${data?.error ?? res.statusText}`);
        return;
      }
      const data = (await res.json()) as { url: string };
      url = data.url;
    }

    // Default the image to fill the floor bounds, honouring intrinsic ratio.
    const w = floor.bounds.maxX - floor.bounds.minX;
    const h = floor.bounds.maxY - floor.bounds.minY;
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: w, height: h });
      img.src = url;
    });
    const ratio = dims.width / dims.height;
    let bgW = w;
    let bgH = w / ratio;
    if (bgH > h) {
      bgH = h;
      bgW = h * ratio;
    }
    onUpdateBackground({
      url,
      x: floor.bounds.minX + (w - bgW) / 2,
      y: floor.bounds.minY + (h - bgH) / 2,
      width: bgW,
      height: bgH,
      opacity: 0.5,
    });
  }

  return (
    <Section title="Canvas">
      {/* Bounds */}
      <div className="flex flex-col gap-2">
        <div className="text-overline text-muted-foreground">Bounds</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(["minX", "minY", "maxX", "maxY"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-muted-foreground">{k}</span>
              <Input
                type="number"
                value={floor.bounds[k]}
                onChange={(e) =>
                  onUpdateBounds({ ...floor.bounds, [k]: Number(e.target.value) })
                }
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {BOUNDS_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.w, p.h)}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-secondary"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-overline text-muted-foreground">Grid</div>
          {floor.grid ? (
            <button
              type="button"
              onClick={() => onUpdateGrid(undefined)}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              switch to auto
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onUpdateGrid({
                  step: defaultGridStep(floor.bounds),
                  subdivisions: 4,
                })
              }
              className="text-[11px] text-muted-foreground hover:underline"
            >
              set manual
            </button>
          )}
        </div>
        {floor.grid ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">step</span>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={grid.step}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0) onUpdateGrid({ ...grid, step: v });
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">subdivisions</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={grid.subdivisions}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(20, Math.round(Number(e.target.value))));
                    onUpdateGrid({ ...grid, subdivisions: v });
                  }}
                />
              </label>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Major lines every {grid.step}; {grid.subdivisions - 1} minor line
              {grid.subdivisions === 2 ? "" : "s"} between them ({(grid.step / grid.subdivisions).toFixed(2)}/minor).
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-background p-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Auto · zoom-adaptive.</span>{" "}
            Major + minor gridlines and grid snap regenerate as you zoom in
            and out — minors get finer when you zoom in, coarser when you
            zoom out, so the render stays light.
          </div>
        )}
      </div>

      {/* Background */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-overline text-muted-foreground">Background image</div>
          {bg && (
            <button
              type="button"
              onClick={() => onUpdateBackground(undefined)}
              className="text-[11px] text-destructive hover:underline"
            >
              remove
            </button>
          )}
        </div>
        {!bg ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-background p-3 text-[11px] text-muted-foreground hover:bg-secondary">
            <span>Click to upload — PNG, JPG, SVG</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickImage(f);
                e.target.value = "";
              }}
            />
          </label>
        ) : (
          <div className="flex flex-col gap-2 text-xs">
            <BackgroundPreview url={bg.url} />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">x</span>
                <Input
                  type="number"
                  value={bg.x}
                  onChange={(e) =>
                    onUpdateBackground({ ...bg, x: Number(e.target.value) })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">y</span>
                <Input
                  type="number"
                  value={bg.y}
                  onChange={(e) =>
                    onUpdateBackground({ ...bg, y: Number(e.target.value) })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">width</span>
                <Input
                  type="number"
                  min={1}
                  value={bg.width}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0) onUpdateBackground({ ...bg, width: v });
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">height</span>
                <Input
                  type="number"
                  min={1}
                  value={bg.height}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0) onUpdateBackground({ ...bg, height: v });
                  }}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">opacity</span>
                <span className="font-mono text-muted-foreground">
                  {bg.opacity.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={bg.opacity}
                onChange={(e) =>
                  onUpdateBackground({ ...bg, opacity: Number(e.target.value) })
                }
                className="w-full"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdateBackground({
                  ...bg,
                  x: floor.bounds.minX,
                  y: floor.bounds.minY,
                  width: floor.bounds.maxX - floor.bounds.minX,
                  height: floor.bounds.maxY - floor.bounds.minY,
                })
              }
            >
              Fit to bounds
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

function BackgroundPreview({ url }: { url: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-[var(--surface-2)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Background reference"
        className="max-h-32 w-full object-contain"
      />
    </div>
  );
}
