"use client";

/**
 * Public entry point for the floor map. Dynamically imports the Leaflet
 * implementation with `ssr: false` because Leaflet touches `window` on
 * module load and would otherwise crash during SSR.
 */
import dynamic from "next/dynamic";
import type { FloorMap as FloorMapData } from "@/lib/map/schema";

const LeafletFloorMap = dynamic(
  () => import("./leaflet-floor-map").then((m) => m.LeafletFloorMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full w-full items-center justify-center bg-[var(--surface-2)] text-[color:var(--muted-foreground)]"
        aria-label="Loading map"
      >
        <span className="text-caption">Loading map…</span>
      </div>
    ),
  },
);

type Props = {
  map: FloorMapData;
  showGraph?: boolean;
  highlightedRoute?: string[];
  emphasisedNodeId?: string;
  lang?: "en" | "el";
  onRoomClick?: (roomId: string) => void;
};

export function FloorMap(props: Props) {
  return <LeafletFloorMap {...props} />;
}
