import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";

/**
 * The floor whose level sits closest to ground level (0). A real ground
 * floor wins outright; with only basements or only upper floors the nearest
 * to 0 is chosen, and a tie favours the upper floor over a basement.
 */
function groundFloorSlug(floors: { slug: string; level: number }[]): string {
  return [...floors].sort(
    (a, b) => Math.abs(a.level) - Math.abs(b.level) || b.level - a.level,
  )[0].slug;
}

export default async function PublicBuildingPage(
  props: { params: Promise<{ publicSlug: string }> },
) {
  const { publicSlug } = await props.params;
  const building = await prisma.building.findFirst({
    where: { publicSlug, status: "published" },
    include: { floors: { select: { slug: true, level: true } } },
  });
  if (!building) notFound();

  if (building.floors.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-h1 mb-2">{building.nameEn}</h1>
        <p className="text-lead">This building has no floors yet.</p>
      </main>
    );
  }

  // Always open the map itself — never a floor picker. The floor switcher
  // lives inside the viewer, so the public URL lands straight on a floor.
  redirect(`/p/${publicSlug}/${groundFloorSlug(building.floors)}`);
}
