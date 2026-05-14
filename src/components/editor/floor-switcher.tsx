"use client";

/**
 * In-studio floor switcher. Replaces the static "Level X · Floor name"
 * breadcrumb with a dropdown so the user can hop between floors of the
 * same building without going back to the building detail page.
 *
 * Confirms with the user when there are unsaved changes (read from the
 * parent FloorEditor via the `dirty` prop) so an accidental switch
 * doesn't silently discard work.
 */
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FloorEntry = {
  id: string;
  slug: string;
  level: number;
  nameEn: string;
};

type Props = {
  buildingId: string;
  currentFloorId: string;
  floors: FloorEntry[];
  /** Set when the editor has unsaved changes — used to prompt before nav. */
  dirty: boolean;
};

export function FloorSwitcher({ buildingId, currentFloorId, floors, dirty }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const current = floors.find((f) => f.id === currentFloorId);

  function goTo(floorId: string) {
    if (floorId === currentFloorId) return;
    if (dirty) {
      const ok = window.confirm(
        "You have unsaved changes. Switch floors anyway? Your edits on this floor will be lost.",
      );
      if (!ok) return;
    }
    startTransition(() => {
      router.push(
        `/dashboard/buildings/${buildingId}/floors/${floorId}/edit`,
      );
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch floor"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate">
          {current
            ? `Level ${current.level} · ${current.nameEn}`
            : "Pick floor"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[color:var(--muted-foreground)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-56">
        <div className="px-2.5 py-1.5 text-overline text-muted-foreground">
          Floors
        </div>
        {floors.map((f) => {
          const active = f.id === currentFloorId;
          return (
            <DropdownMenuItem
              key={f.id}
              render={(props) => (
                <button
                  type="button"
                  {...props}
                  onClick={() => goTo(f.id)}
                  className={`flex w-full items-center justify-between gap-3 ${
                    props.className ?? ""
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={
                        "inline-flex h-6 w-7 items-center justify-center rounded font-mono text-[10px] font-semibold tabular-nums " +
                        (active
                          ? "bg-[var(--brand)] text-white"
                          : "bg-[var(--surface-2)] text-[color:var(--muted-foreground)]")
                      }
                    >
                      L{f.level}
                    </span>
                    <span
                      className={
                        active
                          ? "font-medium text-[color:var(--foreground)]"
                          : "text-[color:var(--foreground)]"
                      }
                    >
                      {f.nameEn}
                    </span>
                  </span>
                  {active && (
                    <span className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
                      current
                    </span>
                  )}
                </button>
              )}
            />
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={(props) => (
            <Link
              href={`/dashboard/buildings/${buildingId}/floors/new`}
              {...props}
              className={`flex items-center gap-2 text-[color:var(--brand)] ${
                props.className ?? ""
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              New floor
            </Link>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
