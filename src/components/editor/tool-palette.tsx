"use client";

import {
  MousePointer2,
  Trash2,
  Minus,
  Square,
  PenTool,
  DoorOpen,
  Spline,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Mode = "structure" | "rooms" | "graph";

export type Tool =
  | "select"
  | "wall"
  | "exterior-wall"
  | "window"
  | "door"
  | "polygon"
  | "drawGraph"
  | "delete";

type ToolDef = {
  id: Tool;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const SELECT_TOOL: ToolDef = {
  id: "select",
  label: "Select",
  hint: "click items, drag nodes",
  Icon: MousePointer2,
};

const DELETE_TOOL: ToolDef = {
  id: "delete",
  label: "Delete",
  hint: "click to remove · or Del key on selection",
  Icon: Trash2,
};

export const TOOLS_BY_MODE: Record<Mode, ToolDef[]> = {
  structure: [
    SELECT_TOOL,
    { id: "wall", label: "Wall", hint: "click 2 points", Icon: Minus },
    { id: "exterior-wall", label: "Exterior wall", hint: "click 2 points", Icon: Square },
    { id: "window", label: "Window", hint: "click 2 points", Icon: Minus },
    { id: "door", label: "Door", hint: "click to place", Icon: DoorOpen },
    DELETE_TOOL,
  ],
  rooms: [
    SELECT_TOOL,
    { id: "polygon", label: "Room", hint: "click points · Enter to close", Icon: PenTool },
    DELETE_TOOL,
  ],
  graph: [
    SELECT_TOOL,
    {
      id: "drawGraph",
      label: "Draw graph",
      hint: "click points · double-click to finish · snaps to existing nodes",
      Icon: Spline,
    },
    DELETE_TOOL,
  ],
};

const MODE_LABELS: Record<Mode, { title: string; sub: string }> = {
  structure: { title: "Structure", sub: "Walls, windows, doors" },
  rooms: { title: "Rooms", sub: "Polygons + metadata" },
  graph: { title: "Graph", sub: "Nodes + edges for routing" },
};

type Props = {
  mode: Mode;
  tool: Tool;
  onModeChange: (m: Mode) => void;
  onToolChange: (t: Tool) => void;
};

export function ToolPalette({ mode, tool, onModeChange, onToolChange }: Props) {
  const tools = TOOLS_BY_MODE[mode];
  return (
    <aside className="flex w-56 flex-col gap-3 border-r border-border bg-card p-3">
      <div className="flex flex-col gap-1">
        <div className="text-overline mb-1 px-1 text-muted-foreground">Mode</div>
        {(Object.keys(MODE_LABELS) as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={cn(
                "rounded-md px-3 py-2 text-left transition-colors",
                active
                  ? "bg-[var(--brand-soft)] text-[var(--accent-foreground)]"
                  : "hover:bg-secondary",
              )}
            >
              <div className="text-sm font-semibold">{MODE_LABELS[m].title}</div>
              <div className="text-xs text-muted-foreground">{MODE_LABELS[m].sub}</div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border pt-3">
        <div className="text-overline mb-2 px-1 text-muted-foreground">Tools</div>
        <div className="flex flex-col gap-1">
          {tools.map((t) => {
            const Icon = t.Icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToolChange(t.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--accent-foreground)]"
                    : "hover:bg-secondary",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4" />
                  {t.label}
                </span>
                <span className="text-xs text-muted-foreground">{t.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
