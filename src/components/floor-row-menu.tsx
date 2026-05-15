"use client";

/**
 * Three-dots menu for a floor row on the building detail page. Holds the
 * floor settings dialog (rename / level / slug) and a two-step delete
 * confirmation. Replaces the old inline Settings + Delete buttons.
 */
import { useState } from "react";
import Link from "next/link";
import { MoreVertical, PenTool, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateFloor, deleteFloor } from "@/app/dashboard/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Props = {
  buildingId: string;
  floor: {
    id: string;
    slug: string;
    level: number;
    nameEn: string;
    nameEl: string;
  };
};

export function FloorRowMenu({ buildingId, floor }: Props) {
  const [dialog, setDialog] = useState<null | "settings" | "delete">(null);
  const [pending, setPending] = useState(false);

  async function onSaveSettings(formData: FormData) {
    setPending(true);
    try {
      await updateFloor(formData);
      toast.success("Floor updated");
      setDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function onConfirmDelete() {
    setPending(true);
    try {
      await deleteFloor(floor.id);
      toast.success(`Deleted “${floor.nameEn}”`);
      setDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${floor.nameEn}`}
          className="grid h-9 w-9 place-items-center rounded-md border border-[var(--border)] bg-[var(--background)] text-[color:var(--muted-foreground)] transition-colors hover:bg-[var(--surface-2)] hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
          <DropdownMenuItem
            render={(props) => (
              <Link
                href={`/dashboard/buildings/${buildingId}/floors/${floor.id}/edit`}
                {...props}
                className={`flex w-full items-center gap-2 ${props.className ?? ""}`}
              >
                <PenTool className="h-4 w-4" />
                Open in studio
              </Link>
            )}
          />
          <DropdownMenuItem
            render={(props) => (
              <button
                type="button"
                {...props}
                onClick={() => setDialog("settings")}
                className={`flex w-full items-center gap-2 ${props.className ?? ""}`}
              >
                <Settings2 className="h-4 w-4" />
                Edit floor
              </button>
            )}
          />
          <DropdownMenuItem
            render={(props) => (
              <button
                type="button"
                {...props}
                onClick={() => setDialog("delete")}
                className={`flex w-full items-center gap-2 text-destructive ${props.className ?? ""}`}
              >
                <Trash2 className="h-4 w-4" />
                Delete floor
              </button>
            )}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings dialog */}
      <Dialog
        open={dialog === "settings"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit floor</DialogTitle>
            <DialogDescription>
              Rename the floor, change its level, or edit its URL slug.
            </DialogDescription>
          </DialogHeader>
          <form action={onSaveSettings} className="flex flex-col gap-4">
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
                onClick={() => setDialog(null)}
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

      {/* Delete confirmation — step two of the two-step delete. */}
      <Dialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this floor?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-[color:var(--foreground)]">
                Level {floor.level} · {floor.nameEn}
              </span>{" "}
              and its entire routing graph will be removed. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialog(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete floor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
