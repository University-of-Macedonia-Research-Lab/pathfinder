"use client";

/**
 * SWR layer for the public floor viewer.
 *
 * The server component still loads the floors via Prisma — that drives the
 * first paint, SEO, and the 404 — and hands the result in as `initial`.
 * SWR adopts it as `fallbackData`, so a normal visit makes zero extra
 * requests. It only revalidates when the tab is refocused or the network
 * reconnects, which keeps a long-open public tab in sync with the owner's
 * latest published edits without a hard reload.
 */
import useSWR from "swr";
import { FloorScreen } from "./floor-screen";
import type { FloorMap } from "@/lib/map/schema";

export type PublicFloorData = {
  buildingSlug: string;
  floors: FloorMap[];
};

async function fetchFloorData(url: string): Promise<PublicFloorData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load floor data");
  return res.json();
}

export function PublicFloorView({
  publicSlug,
  currentFloorSlug,
  initial,
}: {
  publicSlug: string;
  currentFloorSlug: string;
  initial: PublicFloorData;
}) {
  const { data } = useSWR<PublicFloorData>(
    `/api/public/${encodeURIComponent(publicSlug)}`,
    fetchFloorData,
    {
      fallbackData: initial,
      revalidateOnMount: false,
      revalidateIfStale: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const floorData = data ?? initial;

  return (
    <FloorScreen
      buildingSlug={floorData.buildingSlug}
      publicSlug={publicSlug}
      floors={floorData.floors}
      currentFloorSlug={currentFloorSlug}
    />
  );
}
