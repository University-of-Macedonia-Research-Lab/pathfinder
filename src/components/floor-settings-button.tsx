"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateFloor } from "@/app/dashboard/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Props = {
  floor: {
    id: string;
    slug: string;
    level: number;
    nameEn: string;
    nameEl: string;
  };
};

export function FloorSettingsButton({ floor }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateFloor(formData);
      toast.success("Floor updated");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button size="sm" variant="outline" {...props}>
            Settings
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Floor settings</DialogTitle>
          <DialogDescription>
            Rename the floor, change its level, or edit its URL slug.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={floor.id} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`level-${floor.id}`}>Level</Label>
              <Input
                id={`level-${floor.id}`}
                name="level"
                type="number"
                defaultValue={floor.level}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor={`slug-${floor.id}`}>URL slug</Label>
              <Input
                id={`slug-${floor.id}`}
                name="slug"
                defaultValue={floor.slug}
                pattern="[a-z0-9][a-z0-9-]*"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`nameEn-${floor.id}`}>Name (English)</Label>
            <Input
              id={`nameEn-${floor.id}`}
              name="nameEn"
              defaultValue={floor.nameEn}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`nameEl-${floor.id}`}>Name (Greek)</Label>
            <Input
              id={`nameEl-${floor.id}`}
              name="nameEl"
              defaultValue={floor.nameEl}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
