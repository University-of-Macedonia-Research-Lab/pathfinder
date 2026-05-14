import Link from "next/link";
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

  return (
    <div className="-mx-6 -my-8 flex h-[calc(100dvh-65px)] flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3 text-caption">
          <Link href={`/dashboard/buildings/${floor.building.id}`}>
            ← {floor.building.nameEn}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            Level {floor.level} · {floor.nameEn}
          </span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <FloorEditor floorId={floor.id} initial={initial} />
      </div>
    </div>
  );
}
