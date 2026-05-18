import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { loadBuildingFloorMaps } from "@/lib/map/load-floor";
import { PublicFloorView } from "@/components/map/public-floor-view";

export default async function PublicFloorPage(
  props: { params: Promise<{ publicSlug: string; floorSlug: string }> },
) {
  const { publicSlug, floorSlug } = await props.params;

  const building = await prisma.building.findFirst({
    where: { publicSlug, status: "published" },
    include: { floors: { orderBy: { level: "asc" } } },
  });
  if (!building) notFound();
  if (!building.floors.some((f) => f.slug === floorSlug)) notFound();

  const floors = await loadBuildingFloorMaps(building.id);

  return (
    <PublicFloorView
      publicSlug={publicSlug}
      currentFloorSlug={floorSlug}
      initial={{ buildingSlug: building.slug, floors }}
    />
  );
}
