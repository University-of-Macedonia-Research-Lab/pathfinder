import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "muted";
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-[var(--brand-soft)] text-[var(--accent-foreground)]",
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ tone = "default", className, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
