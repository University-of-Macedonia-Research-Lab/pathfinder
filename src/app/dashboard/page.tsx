import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await requireUser();
  const buildings = await prisma.building.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { floors: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Your buildings</h1>
          <p className="text-caption">Create a building, draw its floors, publish it.</p>
        </div>
        <Link href="/dashboard/buildings/new">
          <Button>New building</Button>
        </Link>
      </div>

      {buildings.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-lead mb-4">No buildings yet.</p>
            <Link href="/dashboard/buildings/new">
              <Button>Create your first building</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((b) => (
            <Link key={b.id} href={`/dashboard/buildings/${b.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{b.nameEn}</CardTitle>
                    <Badge tone={b.status === "published" ? "success" : "muted"}>
                      {b.status}
                    </Badge>
                  </div>
                  <CardDescription>{b.nameEl}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-caption">
                    {b._count.floors} floor{b._count.floors === 1 ? "" : "s"} · /{b.slug}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
