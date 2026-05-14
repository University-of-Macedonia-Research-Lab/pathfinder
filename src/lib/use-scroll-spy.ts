"use client";

/**
 * Scroll-spy that watches a list of element ids and returns whichever
 * one currently sits in the upper-middle of the viewport.
 *
 * Uses IntersectionObserver against the implicit (visual) root, which
 * works whether the page scrolls on `window` or inside a parent with
 * `overflow-y-auto` (the AppShell `<main>` does the latter, so a plain
 * `window.scroll` listener never fires).
 *
 * The active band is rootMargin "-10% 0px -40% 0px" — between 10% and
 * 60% of the viewport height. Among intersecting sections, the one
 * whose top is highest wins, so the active item changes as you scroll
 * past each header instead of when each section first peeks into view.
 */
import { useEffect, useState } from "react";

export function useScrollSpy(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const intersecting = new Set<string>();

    const pick = () => {
      let bestId: string | null = null;
      let bestTop = Infinity;
      for (const id of intersecting) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top < bestTop) {
          bestTop = top;
          bestId = id;
        }
      }
      // Don't wipe the active id when nothing's in the band (e.g. the
      // user scrolled past the last section). Keep the previous value.
      if (bestId !== null) {
        setActive((cur) => (cur === bestId ? cur : bestId));
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) intersecting.add(e.target.id);
          else intersecting.delete(e.target.id);
        }
        pick();
      },
      {
        rootMargin: "-10% 0px -40% 0px",
        threshold: 0,
      },
    );
    for (const el of elements) observer.observe(el);

    // Seed active state on mount so the first paint isn't blank.
    const seedTarget = window.innerHeight * 0.25;
    let seed: string | null = null;
    let seedDist = Infinity;
    for (const el of elements) {
      const top = el.getBoundingClientRect().top;
      if (top <= seedTarget) {
        const d = seedTarget - top;
        if (d < seedDist) {
          seedDist = d;
          seed = el.id;
        }
      }
    }
    if (seed) setActive(seed);
    else if (elements[0]) setActive(elements[0].id);

    return () => observer.disconnect();
    // We deliberately depend on the *contents* of `ids`, not the array
    // identity, so callers don't have to memoise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);

  return active;
}
