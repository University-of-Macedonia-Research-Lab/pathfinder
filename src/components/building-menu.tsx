"use client";

/**
 * Three-dots menu for the building detail hero. Holds the building
 * settings dialog (name / description / public slug) and a two-step
 * delete confirmation that requires typing the building name.
 */
import { useState } from "react";
import { MoreVertical, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateBuilding, deleteBuilding } from "@/app/dashboard/actions";
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
import { Input, Label, Textarea } from "@/components/ui/input";

type Props = {
  building: {
    id: string;
    slug: string;
    nameEn: string;
    nameEl: string;
    description: string | null;
    publicSlug: string | null;
  };
};

export function BuildingMenu({ building }: Props) {
  const [dialog, setDialog] = useState<null | "settings" | "delete">(null);
  const [pending, setPending] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function onSaveSettings(formData: FormData) {
    setPending(true);
    try {
      await updateBuilding(formData);
      toast.success("Building updated");
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
      // deleteBuilding redirects to /dashboard on success.
      await deleteBuilding(building.id);
    } catch (err) {
      // A redirect throws a special error Next swallows; only real
      // failures land here.
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setPending(false);
    }
  }

  const canDelete = confirmText.trim() === building.nameEn;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Building actions"
          className="grid h-10 w-10 place-items-center rounded-md border border-[var(--border)] bg-[var(--background)] text-[color:var(--muted-foreground)] transition-colors hover:bg-[var(--surface-2)] hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical className="h-4.5 w-4.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-48">
          <DropdownMenuItem
            render={(props) => (
              <button
                type="button"
                {...props}
                onClick={() => setDialog("settings")}
                className={`flex w-full items-center gap-2 ${props.className ?? ""}`}
              >
                <Settings2 className="h-4 w-4" />
                Building settings
              </button>
            )}
          />
          <DropdownMenuItem
            render={(props) => (
              <button
                type="button"
                {...props}
                onClick={() => {
                  setConfirmText("");
                  setDialog("delete");
                }}
                className={`flex w-full items-center gap-2 text-destructive ${props.className ?? ""}`}
              >
                <Trash2 className="h-4 w-4" />
                Delete building
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
            <DialogTitle>Building settings</DialogTitle>
            <DialogDescription>
              Rename the building, edit its description, or change the public
              URL.
            </DialogDescription>
          </DialogHeader>
          <form action={onSaveSettings} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={building.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-nameEn">Name (English)</Label>
                <Input
                  id="b-nameEn"
                  name="nameEn"
                  required
                  defaultValue={building.nameEn}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-nameEl">Name (Greek)</Label>
                <Input
                  id="b-nameEl"
                  name="nameEl"
                  required
                  defaultValue={building.nameEl}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b-description">Description</Label>
              <Textarea
                id="b-description"
                name="description"
                rows={3}
                defaultValue={building.description ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b-publicSlug">Public URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-caption text-muted-foreground">/p/</span>
                <Input
                  id="b-publicSlug"
                  name="publicSlug"
                  defaultValue={building.publicSlug ?? ""}
                  placeholder={building.slug + "-xxxx"}
                  pattern="[a-z0-9][a-z0-9-]*"
                />
              </div>
              <p className="text-caption text-muted-foreground">
                Lowercase letters, digits, hyphens. Changing this breaks
                existing share links.
              </p>
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
                {pending ? "Saving…" : "Save settings"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — requires typing the building name. */}
      <Dialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this building?</DialogTitle>
            <DialogDescription>
              This removes every floor, every routing graph, and the public
              URL for{" "}
              <span className="font-medium text-[color:var(--foreground)]">
                {building.nameEn}
              </span>
              . There is no undo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-name">
              Type{" "}
              <span className="font-mono text-[color:var(--foreground)]">
                {building.nameEn}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={building.nameEn}
              autoComplete="off"
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
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={pending || !canDelete}
            >
              {pending ? "Deleting…" : "Delete building"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
