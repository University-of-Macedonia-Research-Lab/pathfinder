"use client";

/**
 * App layout shell: a slim header, an optional left sidebar (off-canvas drawer
 * below `lg`), and a main content area that fills the rest of the viewport.
 * Pages compose the shell by passing `header`, `sidebar`, and `children` , 
 * keeping the chrome (logo, nav, menu button) consistent across routes.
 */
import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLang } from "@/lib/i18n";

type Props = {
  /** Slot rendered to the right of the brand in the header (e.g. floor name). */
  headerSlot?: ReactNode;
  /** Sidebar contents, also rendered inside the mobile drawer. Omit to hide. */
  sidebar?: ReactNode;
  /** Title shown at the top of the mobile drawer when open. */
  sidebarTitle?: string;
  /** How the sidebar manifests below `lg`. "drawer" (default) shows a burger
   *  in the header that opens a left slide-in. "none" suppresses both — used
   *  by pages that build their own mobile pattern (e.g. the map demo's
   *  bottom-nav + bottom-sheet). */
  mobileSidebar?: "drawer" | "none";
  children: ReactNode;
};

export function AppShell({
  headerSlot,
  sidebar,
  sidebarTitle,
  mobileSidebar = "drawer",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();
  const t = lang === "el"
    ? { tools: "Εργαλεία", openSidebar: "Άνοιγμα πλαϊνού πίνακα", sidebar: "Πλαϊνό", home: "Αρχική σελίδα" }
    : { tools: "Tools", openSidebar: "Open sidebar", sidebar: "Sidebar", home: "Pathfinder home" };
  const resolvedSidebarTitle = sidebarTitle ?? t.tools;

  return (
    <div className="flex h-dvh flex-col bg-[var(--surface-1)]">
      <Header
        onMenuClick={() => setOpen(true)}
        showMenu={Boolean(sidebar) && mobileSidebar === "drawer"}
        slot={headerSlot}
      />

      <div className="flex min-h-0 flex-1">
        {sidebar && (
          <aside
            // Surface-matched bg so a sidebar full of controls reads as
            // an extension of the canvas the map is painted on, with the
            // single border-r as the only seam between them.
            className="hidden w-80 shrink-0 overflow-y-auto scroll-smooth border-r border-[var(--border)] bg-[var(--surface-2)] lg:block"
            aria-label={t.sidebar}
          >
            <div className="flex flex-col gap-4 p-4">{sidebar}</div>
          </aside>
        )}

        <main className="relative min-w-0 flex-1 overflow-y-auto scroll-smooth">
          {children}
        </main>
      </div>

      {sidebar && mobileSidebar === "drawer" && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
            <div className="flex flex-col gap-1 px-4 pt-4">
              <SheetTitle className="text-h3">{resolvedSidebarTitle}</SheetTitle>
              <SheetDescription className="sr-only">
                {lang === "el" ? "Έλεγχοι χάρτη και βοηθός" : "Map controls and assistant"}
              </SheetDescription>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              {sidebar}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function Header({
  onMenuClick,
  showMenu,
  slot,
}: {
  onMenuClick: () => void;
  showMenu: boolean;
  slot?: ReactNode;
}) {
  const { lang } = useLang();
  const t = lang === "el"
    ? {
        openSidebar: "Άνοιγμα πλαϊνού πίνακα",
        homeAria: "Αρχική σελίδα",
        home: "Αρχική",
      }
    : {
        openSidebar: "Open sidebar",
        homeAria: "Pathfinder home",
        home: "Home",
      };
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--background)] px-5 sm:gap-6 sm:px-8 lg:px-10">
      {showMenu && (
        <button
          type="button"
          onClick={onMenuClick}
          className="grid h-9 w-9 place-items-center rounded-md border border-transparent text-[color:var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[color:var(--foreground)] lg:hidden"
          aria-label={t.openSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <Link
        href="/"
        className="flex shrink-0 items-center text-[color:var(--foreground)]"
        aria-label={t.homeAria}
      >
        <Image
          src="/logo-light.svg"
          alt="Pathfinder"
          width={408}
          height={45}
          priority
          className="h-7 w-auto dark:invert"
        />
      </Link>

      <div className="ml-2 hidden text-caption sm:block">{slot}</div>

      <nav className="ml-auto flex items-center gap-1 text-body sm:gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </nav>
    </header>
  );
}



