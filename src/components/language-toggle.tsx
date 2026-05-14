"use client";

import { useLang, type Lang } from "@/lib/i18n";

/**
 * EN/EL pill toggle for the header. Mirrors the visual weight of the
 * theme toggle, same height, same hover treatment, so the two utility
 * controls read as a pair.
 */
export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label={lang === "el" ? "Επιλογή γλώσσας" : "Language"}
      className="flex h-9 items-center rounded-md border border-[var(--border)] bg-[var(--background)] p-0.5 text-[0.7rem] font-semibold tracking-[0.06em]"
    >
      <Option current={lang} value="en" onSelect={setLang} label="EN" />
      <Option current={lang} value="el" onSelect={setLang} label="EL" />
    </div>
  );
}

function Option({
  current,
  value,
  onSelect,
  label,
}: {
  current: Lang;
  value: Lang;
  onSelect: (l: Lang) => void;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={
        "grid h-full min-w-[2rem] place-items-center rounded-[5px] px-1.5 transition-colors " +
        (active
          ? "bg-[var(--brand)] text-white"
          : "text-[color:var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[color:var(--foreground)]")
      }
    >
      {label}
    </button>
  );
}
