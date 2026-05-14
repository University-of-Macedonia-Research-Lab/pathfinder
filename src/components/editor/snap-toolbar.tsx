"use client";

import { Grid3x3, Magnet, RectangleHorizontal, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SnapMode, SnapState } from "./types";

const TOGGLES: {
  id: SnapMode;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "grid", label: "Grid", hint: "Snap to grid intersections", Icon: Grid3x3 },
  { id: "endpoint", label: "End", hint: "Snap to existing endpoints", Icon: Magnet },
  { id: "ortho", label: "Ortho", hint: "Constrain to 0°/45°/90°", Icon: RectangleHorizontal },
  { id: "intersection", label: "X", hint: "Snap to wall intersections", Icon: Crosshair },
];

type Props = {
  snap: SnapState;
  onChange: (s: SnapState) => void;
};

export function SnapToolbar({ snap, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
      {TOGGLES.map((t) => {
        const Icon = t.Icon;
        const active = snap[t.id];
        return (
          <button
            key={t.id}
            type="button"
            title={`${t.label} — ${t.hint}`}
            onClick={() => onChange({ ...snap, [t.id]: !active })}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--brand-soft)] text-[var(--accent-foreground)]"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
