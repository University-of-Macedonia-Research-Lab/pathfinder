"use client";

/**
 * Dashboard chrome wrapper. Matches the homepage header — sticky, full-
 * bleed, frosted-glass — but swaps the "Sign in" CTA for an avatar
 * dropdown (since the user is already authenticated by the time they
 * reach here). On floor-editor routes we collapse into a full-viewport
 * passthrough so the canvas gets every pixel.
 */
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { UserMenu } from "./user-menu";

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
};

function isStudioRoute(pathname: string): boolean {
  // Floor editor: /dashboard/buildings/<id>/floors/<floorId>/edit
  return /\/floors\/[^/]+\/edit\/?$/.test(pathname);
}

export function DashboardChrome({ user, children }: Props) {
  const pathname = usePathname();
  if (isStudioRoute(pathname)) {
    return <div className="h-dvh bg-[var(--surface-1)]">{children}</div>;
  }
  return (
    <div className="min-h-dvh bg-[var(--surface-1)]">
      <header className="sticky top-0 z-30 w-full border-b border-transparent backdrop-blur-md transition-[background-color,border-color] supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--background),transparent_30%)]">
        <div className="flex h-16 w-full items-center justify-between gap-2 px-4 sm:gap-4 sm:px-10 lg:px-14">
          <Link
            href="/dashboard"
            aria-label="Pathfinder dashboard"
            className="flex shrink-0 items-center"
          >
            {/* Compact mark on phones, full wordmark on sm+. */}
            <Image
              src="/favicon.png"
              alt="Pathfinder"
              width={70}
              height={70}
              priority
              className="h-7 w-7 sm:hidden"
            />
            <Image
              src="/logo-light.svg"
              alt="Pathfinder"
              width={408}
              height={45}
              priority
              className="hidden h-7 w-auto dark:invert sm:block"
            />
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1.5">
            <ThemeToggle />
            <LanguageToggle />
            <span className="ml-1.5">
              <UserMenu user={user} />
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
