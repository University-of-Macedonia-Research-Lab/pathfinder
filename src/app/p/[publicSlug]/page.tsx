import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PublicBuildingPage(
  props: { params: Promise<{ publicSlug: string }> },
) {
  const { publicSlug } = await props.params;
  const building = await prisma.building.findFirst({
    where: { publicSlug, status: "published" },
    include: { floors: { orderBy: { level: "asc" } } },
  });
  if (!building) notFound();

  if (building.floors.length === 1) {
    redirect(`/p/${publicSlug}/${building.floors[0].slug}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-h1 mb-2">{building.nameEn}</h1>
      <p className="text-caption mb-6">{building.nameEl}</p>
      {building.description && <p className="text-body mb-8">{building.description}</p>}

      {building.floors.length === 0 ? (
        <p className="text-lead">This building has no floors yet.</p>
      ) : (
        <div className="grid gap-3">
          {building.floors.map((f) => (
            <Link key={f.id} href={`/p/${publicSlug}/${f.slug}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>Level {f.level} · {f.nameEn}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-caption">{f.nameEl}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
