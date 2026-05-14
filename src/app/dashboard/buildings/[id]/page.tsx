import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  publishBuilding,
  unpublishBuilding,
  deleteBuilding,
  deleteFloor,
} from "@/app/dashboard/actions";

export default async function BuildingPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const user = await requireUser();
  const building = await prisma.building.findFirst({
    where: { id, ownerId: user.id },
    include: { floors: { orderBy: { level: "asc" } } },
  });
  if (!building) notFound();

  const isPublished = building.status === "published";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-caption">← All buildings</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-h1">{building.nameEn}</h1>
            <Badge tone={isPublished ? "success" : "muted"}>{building.status}</Badge>
          </div>
          <p className="text-caption">{building.nameEl} · /{building.slug}</p>
          {building.description && <p className="text-body mt-2 max-w-2xl">{building.description}</p>}
        </div>

        <div className="flex gap-2">
          {isPublished && building.publicSlug && (
            <Link href={`/p/${building.publicSlug}`} target="_blank">
              <Button variant="outline">View public</Button>
            </Link>
          )}
          <form
            action={async () => {
              "use server";
              if (isPublished) await unpublishBuilding(building.id);
              else await publishBuilding(building.id);
            }}
          >
            <Button type="submit" variant={isPublished ? "outline" : "default"}>
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
          </form>
        </div>
      </div>

      {isPublished && building.publicSlug && (
        <Card>
          <CardContent className="p-4 text-caption">
            Public URL:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              /p/{building.publicSlug}
            </code>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-h2">Floors</h2>
        <Link href={`/dashboard/buildings/${building.id}/floors/new`}>
          <Button size="sm">Add floor</Button>
        </Link>
      </div>

      {building.floors.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-lead mb-4">No floors yet.</p>
            <Link href={`/dashboard/buildings/${building.id}/floors/new`}>
              <Button>Add first floor</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {building.floors.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-h3">
                    Level {f.level} · {f.nameEn}
                  </div>
                  <div className="text-caption">{f.nameEl} · /{f.slug}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/buildings/${building.id}/floors/${f.id}/edit`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteFloor(f.id);
                    }}
                  >
                    <Button size="sm" variant="ghost" type="submit">Delete</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Delete this building and all its floors.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await deleteBuilding(building.id);
            }}
          >
            <Button type="submit" variant="destructive">Delete building</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
