"use client";

/**
 * Avatar + dropdown for the dashboard header. Renders the user's Google
 * profile photo when available, otherwise initials over a brand-soft
 * disc. The dropdown holds the name + email (read-only) and the sign-out
 * action, so the navbar itself stays uncluttered.
 */
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "./auth-actions";

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

function initialsOf(s: string): string {
  const cleaned = s.split("@")[0];
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ user }: Props) {
  const fallback = initialsOf(user.name ?? user.email ?? "?");
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(user.image) && !imgError;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={user.name ?? user.email ?? "Account menu"}
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--brand-soft)] text-[color:var(--accent-foreground)] transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {hasImage ? (
          // Profile photo from Google — small enough that Next/Image isn't
          // worth the SSR dance; a plain img keeps the bundle quieter.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image!}
            alt=""
            className="h-9 w-9 object-cover"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-xs font-semibold tracking-tight">{fallback}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
        <div className="flex flex-col gap-0.5 px-2.5 py-2">
          {user.name && (
            <span className="truncate text-sm font-medium text-[color:var(--foreground)]">
              {user.name}
            </span>
          )}
          {user.email && (
            <span className="truncate text-xs text-[color:var(--muted-foreground)]">
              {user.email}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={(props) => (
            <form action={signOutAction} className="contents">
              <button type="submit" {...props} className={`w-full text-left ${props.className ?? ""}`}>
                Sign out
              </button>
            </form>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
