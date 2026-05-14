import Link from "next/link";
import { createBuilding } from "@/app/dashboard/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewBuildingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-caption">← Back</Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>New building</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBuilding} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input id="nameEn" name="nameEn" required placeholder="Main Library" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameEl">Name (Greek)</Label>
              <Input id="nameEl" name="nameEl" required placeholder="Κεντρική Βιβλιοθήκη" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Link href="/dashboard"><Button type="button" variant="ghost">Cancel</Button></Link>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
