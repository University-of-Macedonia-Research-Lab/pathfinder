"use client";

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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Mode } from "./tool-palette";
import type { Selected } from "./types";

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
  selected: Selected;
  onSelect: (s: Selected) => void;
  onUpdateNode: (id: string, patch: Partial<GraphNode>) => void;
  onUpdateEdge: (id: string, patch: Partial<GraphEdge>) => void;
  onUpdateWall: (id: string, patch: Partial<WallSegment>) => void;
  onUpdateDoor: (id: string, patch: Partial<Door>) => void;
  onUpdateRoom: (id: string, patch: Partial<Room>) => void;
  onUpdateBounds: (b: FloorMap["bounds"]) => void;
};

export function EditorSidebar(props: Props) {
  const { mode, floor, selected, onSelect } = props;
  return (
    <aside className="flex w-80 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
      <Section title="Bounds">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(["minX", "minY", "maxX", "maxY"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-muted-foreground">{k}</span>
              <Input
                type="number"
                value={floor.bounds[k]}
                onChange={(e) =>
                  props.onUpdateBounds({
                    ...floor.bounds,
                    [k]: Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
        </div>
      </Section>

      {/* Selected entity editor */}
      {selected?.kind === "node" && (
        <NodeEditor
          node={floor.nodes.find((n) => n.id === selected.id)!}
          rooms={floor.rooms}
          onChange={(patch) => props.onUpdateNode(selected.id, patch)}
        />
      )}
      {selected?.kind === "edge" && (
        <EdgeEditor
          edge={floor.edges.find((e) => e.id === selected.id)!}
          onChange={(patch) => props.onUpdateEdge(selected.id, patch)}
        />
      )}
      {selected?.kind === "wall" && (
        <WallEditor
          wall={floor.walls.find((w) => w.id === selected.id)!}
          onChange={(patch) => props.onUpdateWall(selected.id, patch)}
        />
      )}
      {selected?.kind === "door" && (
        <DoorEditor
          door={floor.doors.find((d) => d.id === selected.id)!}
          rooms={floor.rooms}
          onChange={(patch) => props.onUpdateDoor(selected.id, patch)}
        />
      )}
      {selected?.kind === "room" && (
        <RoomEditor
          room={floor.rooms.find((r) => r.id === selected.id)!}
          onChange={(patch) => props.onUpdateRoom(selected.id, patch)}
        />
      )}

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
  onChange,
}: {
  node: GraphNode;
  rooms: Room[];
  onChange: (patch: Partial<GraphNode>) => void;
}) {
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
