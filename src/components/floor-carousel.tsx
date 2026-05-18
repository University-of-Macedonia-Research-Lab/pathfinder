"use client";

/**
 * Floor thumbnail carousel for the building detail hero. Renders one floor
 * at a time with the standalone SVG renderer (no Leaflet), with arrows to
 * page between floors. Floors are passed pre-parsed from the server page.
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { FloorMapView } from "@/components/map/floor-map-view";
import type { FloorMap } from "@/lib/map/schema";

export type CarouselFloor = {
  id: string;
  level: number;
  nameEn: string;
  map: FloorMap;
};

export function FloorCarousel({
  floors,
  aspectClassName = "aspect-[4/3]",
}: {
  floors: CarouselFloor[];
  /** Tailwind aspect-ratio class for the preview box. */
  aspectClassName?: string;
}) {
  const [idx, setIdx] = useState(0);

  if (floors.length === 0) {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-[color:var(--muted-foreground)] ${aspectClassName}`}
      >
        <Layers className="h-6 w-6" />
        <span className="text-caption">No floors to preview</span>
      </div>
    );
  }

  const n = floors.length;
  const safeIdx = Math.min(idx, n - 1);
  const current = floors[safeIdx];
  const isEmpty =
    current.map.rooms.length === 0 &&
    current.map.walls.length === 0 &&
    current.map.nodes.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] ${aspectClassName}`}
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-[color:var(--muted-foreground)]">
            <Layers className="h-6 w-6" />
            <span className="text-caption">Empty floor, nothing drawn yet</span>
          </div>
        ) : (
          <FloorMapView map={current.map} showGraph />
        )}

        {n > 1 && (
          <>
            <CarouselArrow
              side="left"
              onClick={() => setIdx((i) => (i - 1 + n) % n)}
            />
            <CarouselArrow
              side="right"
              onClick={() => setIdx((i) => (i + 1) % n)}
            />
          </>
        )}

        {/* Level chip, top-left */}
        <span className="absolute left-2 top-2 rounded-md bg-[var(--background)]/90 px-2 py-0.5 font-mono text-[11px] font-semibold text-[color:var(--foreground)] shadow-sm">
          L{current.level}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="truncate text-[color:var(--foreground)]">
          {current.nameEn}
        </span>
        {n > 1 && (
          <span className="shrink-0 font-mono text-[color:var(--muted-foreground)]">
            {safeIdx + 1} / {n}
          </span>
        )}
      </div>

      {n > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {floors.map((f, i) => (
            <button
              key={f.id}
              type="button"
              aria-label={`Show ${f.nameEn}`}
              onClick={() => setIdx(i)}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === safeIdx
                  ? "w-5 bg-[var(--brand)]"
                  : "w-1.5 bg-[var(--border)] hover:bg-[var(--muted-foreground)]")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous floor" : "Next floor"}
      className={
        "absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--background)]/90 text-[color:var(--foreground)] shadow-sm backdrop-blur transition-colors hover:bg-[var(--background)] " +
        (side === "left" ? "left-2" : "right-2")
      }
    >
      {side === "left" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}
