import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadBuildingFloorMaps } from "@/lib/map/load-floor";

/**
 * Public, read-only floor data for a published building. Backs the SWR
 * layer in the public viewer so an open tab picks up the owner's latest
 * published edits on window refocus. Only published buildings are exposed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ publicSlug: string }> },
) {
  const { publicSlug } = await params;
  const building = await prisma.building.findFirst({
    where: { publicSlug, status: "published" },
    select: { id: true, slug: true },
  });
  if (!building) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const floors = await loadBuildingFloorMaps(building.id);
  return NextResponse.json({ buildingSlug: building.slug, floors });
}
