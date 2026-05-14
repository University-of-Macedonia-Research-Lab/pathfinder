"use client";

/**
 * Indoor floor plan rendered as a Leaflet map.
 *
 * Why Leaflet for an indoor map: we want the *interaction* of a map (smooth
 * pan, pinch-zoom, double-tap, attribution slot, mobile gestures) without
 * caring about geography. Leaflet's `CRS.Simple` is exactly that, a flat
 * Cartesian plane where 1 unit = 1 unit at zoom 0. We hand it the bounds of
 * our floor JSON and place our existing programmatic SVG inside an
 * `SVGOverlay`, which keeps room hover/click handlers working unchanged.
 *
 * The component is dynamically imported with `ssr: false` from the parent
 * because Leaflet touches `window` at import time.
 */
import { useMemo } from "react";
import { MapContainer, SVGOverlay, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FloorMapInner } from "./floor-map-view";
import type { FloorMap } from "@/lib/map/schema";

type Props = {
  map: FloorMap;
  showGraph?: boolean;
  highlightedRoute?: string[];
  emphasisedNodeId?: string;
  lang?: "en" | "el";
  onRoomClick?: (roomId: string) => void;
};

export function LeafletFloorMap({
  map,
  showGraph,
  highlightedRoute,
  emphasisedNodeId,
  lang,
  onRoomClick,
}: Props) {
  const { minX, minY, maxX, maxY } = map.bounds;
  const w = maxX - minX;
  const h = maxY - minY;
  const longest = Math.max(w, h);

  // [lat, lng] = [y, x], CRS.Simple is non-geographic, so we just use the
  // floor's native coordinate frame.
  const bounds = useMemo<L.LatLngBoundsExpression>(
    () => [
      [minY, minX],
      [maxY, maxX],
    ],
    [minY, minX, maxY, maxX],
  );

  // Let the user pan a little past the floor edges, but not into infinity.
  const maxBounds = useMemo<L.LatLngBoundsExpression>(() => {
    const pad = longest * 0.5;
    return [
      [minY - pad, minX - pad],
      [maxY + pad, maxX + pad],
    ];
  }, [minX, minY, maxX, maxY, longest]);

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={maxBounds}
      maxBoundsViscosity={1}
      minZoom={-2}
      maxZoom={4}
      zoomSnap={0.25}
      zoomDelta={0.5}
      attributionControl={false}
      zoomControl={false}
      className="h-full w-full bg-[var(--surface-2)]"
    >
      {/* Zoom buttons live in the top-right so they never collide with the
          floating command dock that anchors top-left on md+ screens. */}
      <ZoomControl position="topright" />
      <SVGOverlay
        bounds={bounds}
        attributes={{
          viewBox: `${minX} ${minY} ${w} ${h}`,
          preserveAspectRatio: "none",
        }}
      >
        <FloorMapInner
          map={map}
          showGraph={showGraph}
          highlightedRoute={highlightedRoute}
          emphasisedNodeId={emphasisedNodeId}
          lang={lang}
          onRoomClick={onRoomClick}
        />
      </SVGOverlay>
    </MapContainer>
  );
}

export default LeafletFloorMap;
