import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { createFloor } from "@/app/dashboard/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function NewFloorPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const user = await requireUser();
  const building = await prisma.building.findFirst({
    where: { id, ownerId: user.id },
    include: { floors: { orderBy: { level: "desc" }, take: 1 } },
  });
  if (!building) notFound();

  const nextLevel = (building.floors[0]?.level ?? -1) + 1;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/dashboard/buildings/${building.id}`} className="text-caption">← Back to {building.nameEn}</Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>New floor</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFloor} className="flex flex-col gap-4">
            <input type="hidden" name="buildingId" value={building.id} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="level">Level (0 = ground)</Label>
              <Input id="level" name="level" type="number" defaultValue={nextLevel} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input id="nameEn" name="nameEn" required placeholder="Ground Floor" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameEl">Name (Greek)</Label>
              <Input id="nameEl" name="nameEl" required placeholder="Ισόγειο" />
            </div>
            <div className="flex justify-end gap-2">
              <Link href={`/dashboard/buildings/${building.id}`}>
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
              <Button type="submit">Create floor</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
