"use client";

/**
 * Minimal language context for Pathfinder.
 *
 * Exposes `useLang()` returning the current language ("en" | "el") and a
 * setter. The choice is persisted to localStorage. On first visit we look
 * at `navigator.language` and pick "el" only if the user's preferred
 * language starts with "el", otherwise we default to "en". Strings are
 * defined per consumer (no central message catalogue), which keeps each
 * component readable as a unit.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "el";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

const LangContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "pathfinder.lang";

function detectInitial(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "el") return saved;
  } catch {
    // ignore
  }
  const nav = window.navigator.language || "";
  return nav.toLowerCase().startsWith("el") ? "el" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLangState(detectInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang, hydrated]);

  const value = useMemo<Ctx>(() => ({ lang, setLang: setLangState }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Outside a provider (e.g. during a unit test of a leaf component) we
    // fall back to "en" rather than throwing, keeps consumers usable in
    // isolation without forcing every test to wrap in a provider.
    return { lang: "en", setLang: () => {} };
  }
  return ctx;
}

/** Tiny helper for inline label dictionaries. */
export function pickLang<T>(lang: Lang, en: T, el: T): T {
  return lang === "el" ? el : en;
}
