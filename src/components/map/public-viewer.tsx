"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FloorMap } from "@/lib/map/schema";
import { PROFILES, type Profile } from "@/lib/map/pathfind";
import { findMultiFloorRouteBetweenRooms } from "@/lib/map/multi-pathfind";
import { FloorMap as FloorMapView } from "./floor-map";
import { cn } from "@/lib/utils";

type FloorMeta = { slug: string; level: number; nameEn: string; nameEl: string };

type Props = {
  publicSlug: string;
  currentFloorSlug: string;
  initialFloor: FloorMap;
  allFloors: FloorMap[];
  floors: FloorMeta[];
};

export function PublicViewer({
  publicSlug,
  currentFloorSlug,
  initialFloor,
  allFloors,
  floors,
}: Props) {
  const [showGraph, setShowGraph] = useState(false);
  const [profileId, setProfileId] = useState<string>("default");
  const [fromRef, setFromRef] = useState<{ floor: string; room: string } | null>(null);
  const [toRef, setToRef] = useState<{ floor: string; room: string } | null>(null);

  const profile: Profile = PROFILES[profileId] ?? PROFILES.default;

  const roomOptions = useMemo(
    () =>
      allFloors.flatMap((f) =>
        f.rooms.map((r) => ({
          floor: f.floorSlug,
          floorLabel: floors.find((m) => m.slug === f.floorSlug)?.nameEn ?? f.floorSlug,
          room: r.id,
          label: r.code ? `${r.code} · ${r.name.en}` : r.name.en,
        })),
      ),
    [allFloors, floors],
  );

  const path = useMemo(() => {
    if (!fromRef || !toRef) return null;
    return findMultiFloorRouteBetweenRooms(allFloors, fromRef, toRef, profile);
  }, [fromRef, toRef, profile, allFloors]);

  const currentSegment = useMemo(() => {
    if (!path) return undefined;
    const seg = path.segments.find((s) => s.floorSlug === currentFloorSlug);
    return seg?.nodes;
  }, [path, currentFloorSlug]);

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4">
        <section className="flex flex-col gap-2">
          <div className="text-overline text-muted-foreground">Floors</div>
          <div className="flex flex-wrap gap-1.5">
            {floors.map((f) => (
              <Link
                key={f.slug}
                href={`/p/${publicSlug}/${f.slug}`}
                className={cn(
                  "rounded-md border border-border px-2.5 py-1 text-xs",
                  f.slug === currentFloorSlug
                    ? "bg-[var(--brand-soft)] text-[var(--accent-foreground)]"
                    : "bg-card hover:bg-secondary",
                )}
              >
                L{f.level} · {f.nameEn}
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-overline text-muted-foreground">Profile</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(PROFILES).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfileId(p.id)}
                className={cn(
                  "rounded-md border border-border px-2.5 py-1 text-xs",
                  p.id === profileId
                    ? "bg-[var(--brand-soft)] text-[var(--accent-foreground)]"
                    : "bg-card hover:bg-secondary",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="text-overline text-muted-foreground">Route</div>
          <RoomSelect
            label="From"
            options={roomOptions}
            value={fromRef}
            onChange={setFromRef}
          />
          <RoomSelect
            label="To"
            options={roomOptions}
            value={toRef}
            onChange={setToRef}
          />
          {fromRef && toRef && (
            <div className="text-caption mt-1">
              {path ? `Route found · cost ${path.cost.toFixed(1)}` : "No route for this profile."}
            </div>
          )}
        </section>

        <section className="flex items-center justify-between">
          <label className="text-xs">
            <input
              type="checkbox"
              checked={showGraph}
              onChange={(e) => setShowGraph(e.target.checked)}
              className="mr-1.5"
            />
            Show routing graph
          </label>
        </section>

        <section className="text-caption">
          <div>Rooms: {initialFloor.rooms.length}</div>
          <div>Nodes: {initialFloor.nodes.length}</div>
          <div>Edges: {initialFloor.edges.length}</div>
        </section>
      </aside>

      <div className="min-h-0 flex-1">
        <FloorMapView
          map={initialFloor}
          showGraph={showGraph}
          highlightedRoute={currentSegment}
        />
      </div>
    </div>
  );
}

function RoomSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { floor: string; floorLabel: string; room: string; label: string }[];
  value: { floor: string; room: string } | null;
  onChange: (v: { floor: string; room: string } | null) => void;
}) {
  const grouped = useMemo(() => {
    const m = new Map<string, typeof options>();
    for (const o of options) {
      const arr = m.get(o.floorLabel) ?? [];
      arr.push(o);
      m.set(o.floorLabel, arr);
    }
    return Array.from(m.entries());
  }, [options]);

  const selectedKey = value ? `${value.floor}::${value.room}` : "";

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={selectedKey}
        onChange={(e) => {
          if (!e.target.value) return onChange(null);
          const [floor, room] = e.target.value.split("::");
          onChange({ floor, room });
        }}
      >
        <option value="">— pick a room —</option>
        {grouped.map(([label, opts]) => (
          <optgroup key={label} label={label}>
            {opts.map((o) => (
              <option key={`${o.floor}::${o.room}`} value={`${o.floor}::${o.room}`}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
