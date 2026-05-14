import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { parseFloorMap } from "@/lib/map/schema";
import { FloorEditor } from "@/components/editor/floor-editor";

export default async function FloorEditPage(
  props: { params: Promise<{ id: string; floorId: string }> },
) {
  const { id, floorId } = await props.params;
  const user = await requireUser();
  const floor = await prisma.floor.findFirst({
    where: { id: floorId, buildingId: id, building: { ownerId: user.id } },
    include: { building: { select: { id: true, nameEn: true, slug: true } } },
  });
  if (!floor) notFound();

  const initial = parseFloorMap(JSON.parse(floor.data));

  // Load every floor of this building once. The editor needs:
  //  - the current floor's geometry (parsed above)
  //  - a slim sibling list for cross-floor link picking
  //  - a flat list for the in-studio floor switcher
  const buildingFloors = await prisma.floor.findMany({
    where: { buildingId: id },
    orderBy: { level: "asc" },
    select: { id: true, slug: true, level: true, nameEn: true, data: true },
  });

  const floorList = buildingFloors.map((f) => ({
    id: f.id,
    slug: f.slug,
    level: f.level,
    nameEn: f.nameEn,
  }));

  const siblingFloors = buildingFloors
    .filter((s) => s.id !== floor.id)
    .map((s) => {
      const parsed = parseFloorMap(JSON.parse(s.data));
      return {
        slug: s.slug,
        level: s.level,
        nameEn: s.nameEn,
        nodes: parsed.nodes.map((n) => ({
          id: n.id,
          position: n.position,
          roomId: n.roomId,
          connectsToFloor: n.connectsToFloor,
        })),
        rooms: parsed.rooms.map((r) => ({
          id: r.id,
          code: r.code,
          nameEn: r.name.en,
          kind: r.kind,
        })),
      };
    });

  return (
    <FloorEditor
      buildingId={floor.building.id}
      buildingName={floor.building.nameEn}
      floorId={floor.id}
      initial={initial}
      siblingFloors={siblingFloors}
      floorList={floorList}
    />
  );
}
