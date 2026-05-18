"use client";

/**
 * Pathfinder homepage.
 *
 * Minimal, big type, lots of whitespace. The visual identity is a tiny
 * animated floor plan — a route drawing itself — set under the wordmark.
 * Short copy, sharp targeting. Avoids the long "teaching project" tone of
 * the sister accessmap site; this page is selling.
 */
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Accessibility,
  CheckCircle2,
  Code2,
  Compass,
  Globe,
  Languages,
  PenTool,
  Share2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export function HomeContent({ isAuthed }: { isAuthed: boolean }) {
  return (
    <div className="relative isolate min-h-dvh bg-[var(--background)] text-[color:var(--foreground)]">
      <Backdrop />
      <Header isAuthed={isAuthed} />
      {/* Each section lives in a SectionShell that gives it a generous
          minimum height and vertically-centers its content — the hero
          fills the viewport, the rest get room to breathe. */}
      <main className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-16 px-5 pb-24 sm:gap-24 sm:px-8">
        <SectionShell variant="hero">
          <Hero isAuthed={isAuthed} />
        </SectionShell>
        <SectionShell>
          <HowItWorks />
        </SectionShell>
        <SectionShell>
          <Showcase />
        </SectionShell>
        <SectionShell>
          <ClosingCta isAuthed={isAuthed} />
        </SectionShell>
      </main>
      <Footer />
    </div>
  );
}

/** Vertically-centering wrapper that gives every homepage section a
 *  consistent minimum height. The `hero` variant fills the viewport
 *  exactly (minus the 4rem sticky header); the default variant gives
 *  shorter sections enough room that they never feel cramped. */
function SectionShell({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "hero" | "default";
}) {
  return (
    <div
      className={
        "flex w-full flex-col items-center justify-center " +
        (variant === "hero"
          ? "min-h-[calc(100dvh-4rem)]"
          : "min-h-[72vh]")
      }
    >
      {children}
    </div>
  );
}

/* Backdrop */
//
// Full-bleed ambient background: a heavily-blurred neon ring (conic gradient
// masked into a band), a bright core haze, and two drifting blobs — all
// spanning the full viewport width since the Backdrop lives at the page
// root, outside the max-width content column. A faint dot grid sits on top
// for texture. Everything is decorative and motion-disabled under
// prefers-reduced-motion.

function Backdrop() {
  return (
    <>
      {/* Neon glow zone — concentrated behind the hero, full screen wide. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[135vh] overflow-hidden"
      >
        {/* Wide soft wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 58% at 50% 2%, var(--glow-wash) 0%, transparent 72%)",
          }}
        />
        {/* The neon ring — conic gradient masked into a wide band, then
            heavily blurred so it reads as a smooth wash of light rather
            than a defined circle. Wide band + big blur = soft + seamless. */}
        <div className="absolute left-1/2 top-[34vh] -translate-x-1/2 -translate-y-1/2">
          <div
            className="pathfinder-spin aspect-square w-[90rem] max-w-[210vw] rounded-full opacity-80"
            style={{
              background:
                "conic-gradient(from 120deg, var(--glow-1), var(--glow-2), var(--glow-3), var(--glow-4), var(--glow-1))",
              maskImage:
                "radial-gradient(closest-side, transparent 42%, #000 62%, #000 80%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(closest-side, transparent 42%, #000 62%, #000 80%, transparent 100%)",
              filter: "blur(160px)",
            }}
          />
        </div>
        {/* Bright core haze inside the ring — nearly white. */}
        <div
          className="absolute left-1/2 top-[26vh] h-[32rem] w-[60rem] max-w-[160vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--glow-haze), transparent 72%)",
            filter: "blur(120px)",
          }}
        />
        {/* Drifting flank blobs for asymmetry + depth — soft, near-white. */}
        <div
          className="pathfinder-drift-a absolute h-[32rem] w-[32rem] rounded-full opacity-60"
          style={{
            left: "-10rem",
            top: "2vh",
            background:
              "radial-gradient(circle at center, var(--glow-blob-a), transparent 66%)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="pathfinder-drift-b absolute h-[28rem] w-[28rem] rounded-full opacity-55"
          style={{
            right: "-8rem",
            top: "14vh",
            background:
              "radial-gradient(circle at center, var(--glow-blob-b), transparent 66%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      {/* Dot grid texture, full page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          opacity: 0.025,
        }}
      />

      <style jsx>{`
        :global(.pathfinder-spin) {
          animation: pf-spin 44s linear infinite;
        }
        :global(.pathfinder-drift-a) {
          animation: pf-drift-a 17s ease-in-out infinite;
        }
        :global(.pathfinder-drift-b) {
          animation: pf-drift-b 19s ease-in-out infinite;
        }
        @keyframes pf-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pf-drift-a {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(2.5rem, 2rem); }
        }
        @keyframes pf-drift-b {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-2rem, 2.5rem); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.pathfinder-spin),
          :global(.pathfinder-drift-a),
          :global(.pathfinder-drift-b) {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

/* Header */

function Header({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header
      // Sticky, full-bleed header. Translucent-with-blur so the hero
      // gradient shows through subtly at the top of the page, then frosts
      // over content as the user scrolls. `supports-[backdrop-filter]`
      // keeps the fallback usable on browsers without the filter.
      className="sticky top-0 z-30 w-full border-b border-transparent backdrop-blur-md transition-[background-color,border-color] supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--background),transparent_30%)]"
    >
      <div className="flex h-16 w-full items-center justify-between gap-2 px-4 sm:gap-4 sm:px-10 lg:px-14">
        <Link
          href="/"
          aria-label="Pathfinder home"
          className="flex shrink-0 items-center"
        >
          {/* Compact favicon mark on phones, full wordmark on sm+ — the
              218px-wide wordmark would crowd the header on small screens. */}
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
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <ThemeToggle />
          <LanguageToggle />
          <Link
            href={isAuthed ? "/dashboard" : "/signin"}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--foreground)] px-3.5 py-1.5 text-sm font-medium text-[color:var(--background)] hover:opacity-90 sm:ml-2 sm:px-4"
          >
            {isAuthed ? "Dashboard" : "Sign in"}
            <ArrowRight className="hidden h-3.5 w-3.5 sm:inline-block" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* Hero */

function Hero({ isAuthed }: { isAuthed: boolean }) {
  const { lang } = useLang();
  const t = heroCopy(lang);
  return (
    <section className="relative flex w-full flex-col items-center gap-10 text-center sm:gap-12">
      <AnimatedPathDemo />

      <div className="relative flex flex-col items-center gap-6">
        <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          {t.headline}
        </h1>
        <p className="text-balance max-w-[44ch] text-base text-[color:var(--muted-foreground)] sm:text-lg">
          {t.sub}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={isAuthed ? "/dashboard" : "/signin"}
          className="group inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-[background,transform] hover:bg-[var(--brand-strong)] active:translate-y-px"
        >
          {isAuthed ? t.ctaDashboard : t.ctaStart}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <a
          href="#features"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-6 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[var(--surface-2)]"
        >
          {t.ctaTour}
        </a>
      </div>
    </section>
  );
}

function heroCopy(lang: Lang) {
  if (lang === "el") {
    return {
      headline: "Πλοήγηση εσωτερικού χώρου, εύκολα.",
      sub: "Σχεδιάστε χάρτες ορόφων με προσβάσιμη δρομολόγηση. Δημοσιεύστε σε ένα URL.",
      ctaStart: "Ξεκινήστε δωρεάν",
      ctaDashboard: "Στο dashboard",
      ctaTour: "Δείτε πώς",
    };
  }
  return {
    headline: "Indoor wayfinding, done.",
    sub: "Draw a floor plan, route around stairs, publish at a URL. For campuses and organisations that welcome the public.",
    ctaStart: "Get started for free",
    ctaDashboard: "Open dashboard",
    ctaTour: "See how",
  };
}

/** A small SVG floor plan with a route that draws itself on a loop. The
 *  whole pitch — "indoor wayfinding" — visualised in 8 seconds, repeatedly. */
function AnimatedPathDemo() {
  return (
    <div className="relative w-full max-w-[29.4rem]">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.13_27)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.86_0.13_75)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.13_150)]" />
          <span className="ml-3 truncate text-[11px] text-[color:var(--muted-foreground)]">
            main-library / level 0
          </span>
        </div>
        <div className="relative aspect-[16/9] bg-[var(--surface-2)]">
          <svg
            viewBox="0 0 800 450"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Soft drop shadow on the route */}
              <filter id="route-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            {/* Floor base */}
            <rect x="0" y="0" width="800" height="450" fill="var(--surface-2)" />

            {/* Grid */}
            {Array.from({ length: 32 }).map((_, i) => (
              <line
                key={`gx${i}`}
                x1={i * 25}
                y1={0}
                x2={i * 25}
                y2={450}
                stroke="oklch(0.86 0.008 270)"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                key={`gy${i}`}
                x1={0}
                y1={i * 25}
                x2={800}
                y2={i * 25}
                stroke="oklch(0.86 0.008 270)"
                strokeWidth="0.5"
              />
            ))}

            {/* Rooms */}
            <g>
              <rect x="60" y="60" width="160" height="120" fill="oklch(0.94 0.025 250)" stroke="oklch(0.7 0.02 270)" />
              <rect x="240" y="60" width="200" height="120" fill="oklch(0.94 0.025 295)" stroke="oklch(0.7 0.02 270)" />
              <rect x="460" y="60" width="160" height="120" fill="oklch(0.93 0.04 330)" stroke="oklch(0.7 0.02 270)" />
              <rect x="640" y="60" width="100" height="120" fill="oklch(0.93 0.06 65)" stroke="oklch(0.7 0.02 270)" />
              <rect x="60" y="280" width="200" height="110" fill="oklch(0.94 0.04 80)" stroke="oklch(0.7 0.02 270)" />
              <rect x="280" y="280" width="160" height="110" fill="oklch(0.93 0.04 200)" stroke="oklch(0.7 0.02 270)" />
              <rect x="460" y="280" width="280" height="110" fill="oklch(0.96 0.005 95)" stroke="oklch(0.7 0.02 270)" />
              {/* Corridor */}
              <rect x="60" y="200" width="680" height="60" fill="oklch(0.96 0.005 95)" stroke="oklch(0.7 0.02 270)" />
            </g>

            {/* Room labels */}
            <g pointerEvents="none">
              <text x="140" y="125" textAnchor="middle" fontSize="14" fill="oklch(0.3 0.02 270)" fontWeight={500}>101</text>
              <text x="340" y="125" textAnchor="middle" fontSize="14" fill="oklch(0.3 0.02 270)" fontWeight={500}>Lab A</text>
              <text x="540" y="125" textAnchor="middle" fontSize="14" fill="oklch(0.3 0.02 270)" fontWeight={500}>205</text>
              <text x="690" y="125" textAnchor="middle" fontSize="12" fill="oklch(0.3 0.02 270)" fontWeight={500}>Elev.</text>
              <text x="160" y="340" textAnchor="middle" fontSize="14" fill="oklch(0.3 0.02 270)" fontWeight={500}>Auditorium</text>
              <text x="360" y="340" textAnchor="middle" fontSize="14" fill="oklch(0.3 0.02 270)" fontWeight={500}>WC</text>
              <text x="600" y="340" textAnchor="middle" fontSize="13" fill="oklch(0.3 0.02 270)" fontWeight={500}>Reading Room</text>
            </g>

            {/* Animated route — draws itself, pauses, dissolves, repeats. */}
            <g>
              <path
                className="pathfinder-route-halo"
                d="M 690 350 L 690 230 L 340 230 L 340 125"
                fill="none"
                stroke="white"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
              />
              <path
                className="pathfinder-route-stroke"
                d="M 690 350 L 690 230 L 340 230 L 340 125"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
              />
            </g>

            {/* Endpoints */}
            <g className="pathfinder-endpoints">
              <circle cx="690" cy="350" r="10" fill="white" stroke="var(--brand)" strokeWidth="3" />
              <circle cx="340" cy="125" r="10" fill="white" stroke="var(--brand)" strokeWidth="3" />
            </g>
          </svg>
        </div>
      </div>

      {/* Local CSS animations for the demo + the floating mark. Kept in
          this file so the homepage owns its motion without polluting
          globals.css. Respects prefers-reduced-motion via globals. */}
      <style jsx>{`
        :global(.pathfinder-route-halo) {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: pf-draw 7s ease-in-out infinite;
        }
        :global(.pathfinder-route-stroke) {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: pf-draw 7s ease-in-out infinite;
        }
        :global(.pathfinder-endpoints) {
          opacity: 0;
          animation: pf-endpoints 7s ease-in-out infinite;
        }
        @keyframes pf-draw {
          0% { stroke-dashoffset: 1; opacity: 0; }
          10% { opacity: 1; }
          55% { stroke-dashoffset: 0; opacity: 1; }
          85% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes pf-endpoints {
          0%, 6% { opacity: 0; }
          12%, 90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.pathfinder-route-halo),
          :global(.pathfinder-route-stroke),
          :global(.pathfinder-endpoints) {
            animation: none;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/* How it works */

function HowItWorks() {
  const { lang } = useLang();
  const isEl = lang === "el";
  const steps = isEl
    ? [
        {
          Icon: Upload,
          n: "01",
          title: "Ανεβάστε",
          body: "Σαρωμένη κάτοψη, PDF ή screenshot CAD. Το Studio το χρησιμοποιεί ως φόντο.",
          Art: ArtUpload,
        },
        {
          Icon: PenTool,
          n: "02",
          title: "Σχεδιάστε",
          body: "Τοίχοι, δωμάτια, κόμβοι, ακμές. Snap CAD κρατά τα πάντα ευθυγραμμισμένα.",
          Art: ArtTrace,
        },
        {
          Icon: Share2,
          n: "03",
          title: "Δημοσιεύστε",
          body: "Δημόσιο URL αμέσως. Ενσωματώστε, μοιραστείτε, τυπώστε QR.",
          Art: ArtPublish,
        },
      ]
    : [
        {
          Icon: Upload,
          n: "01",
          title: "Upload",
          body: "A scan, a PDF, or a CAD screenshot. The studio drops it in as a tracing background.",
          Art: ArtUpload,
        },
        {
          Icon: PenTool,
          n: "02",
          title: "Trace",
          body: "Walls, rooms, nodes, edges. CAD-style snap keeps every line aligned.",
          Art: ArtTrace,
        },
        {
          Icon: Share2,
          n: "03",
          title: "Publish",
          body: "A permanent public URL. Embed, share, or print as a hallway QR.",
          Art: ArtPublish,
        },
      ];
  return (
    <section id="features" className="w-full">
      <SectionEyebrow
        eyebrow={isEl ? "Πώς δουλεύει" : "How it works"}
        title={isEl ? "Από κάτοψη σε ζωντανό URL σε ένα απόγευμα." : "From floor plan to live URL in one afternoon."}
      />
      <div className="mt-12 grid gap-6 sm:gap-8 md:grid-cols-3">
        {steps.map((s) => (
          <Step key={s.title} {...s} />
        ))}
      </div>
    </section>
  );
}

function Step({
  Icon,
  n,
  title,
  body,
  Art,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  n: string;
  title: string;
  body: string;
  Art: React.ComponentType;
}) {
  return (
    <article className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--brand)]"
          style={{ background: "var(--brand-soft)" }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-xs font-semibold tracking-[0.1em] text-[color:var(--muted-foreground)]">
          {n}
        </span>
      </div>
      <div className="aspect-[5/3] w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
        <Art />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-[color:var(--muted-foreground)]">{body}</p>
      </div>
    </article>
  );
}

/* Small SVG illustrations for the three steps — abstract enough to age
 * gracefully, concrete enough that the reader recognises what's happening
 * without reading the body copy first. */

function ArtUpload() {
  return (
    <svg viewBox="0 0 300 180" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {/* Background scan/PDF representation */}
      <rect x="60" y="36" width="180" height="108" rx="6" fill="white" stroke="oklch(0.85 0.01 270)" strokeWidth="1.5" />
      <line x1="80" y1="60" x2="200" y2="60" stroke="oklch(0.85 0.01 270)" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="72" x2="180" y2="72" stroke="oklch(0.85 0.01 270)" strokeWidth="2" strokeLinecap="round" />
      <rect x="80" y="86" width="60" height="40" fill="none" stroke="oklch(0.85 0.01 270)" strokeWidth="1.5" />
      <rect x="146" y="86" width="60" height="40" fill="none" stroke="oklch(0.85 0.01 270)" strokeWidth="1.5" />
      {/* Upload arrow overlay */}
      <g>
        <circle cx="150" cy="90" r="26" fill="var(--brand)" />
        <path
          d="M 150 102 L 150 80 M 140 90 L 150 80 L 160 90"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function ArtTrace() {
  return (
    <svg viewBox="0 0 300 180" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid */}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={`tx${i}`} x1={i * 25} y1={0} x2={i * 25} y2={180} stroke="oklch(0.86 0.008 270)" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`ty${i}`} x1={0} y1={i * 25} x2={300} y2={i * 25} stroke="oklch(0.86 0.008 270)" strokeWidth="0.5" />
      ))}
      {/* Faint background scan */}
      <rect x="30" y="30" width="120" height="60" fill="none" stroke="oklch(0.85 0.01 270)" strokeWidth="1" opacity="0.5" />
      <rect x="30" y="100" width="240" height="50" fill="none" stroke="oklch(0.85 0.01 270)" strokeWidth="1" opacity="0.5" />
      <rect x="170" y="30" width="100" height="60" fill="none" stroke="oklch(0.85 0.01 270)" strokeWidth="1" opacity="0.5" />
      {/* Traced result on top */}
      <rect x="30" y="30" width="120" height="60" fill="oklch(0.94 0.025 250)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
      <rect x="170" y="30" width="100" height="60" fill="oklch(0.94 0.04 80)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
      <rect x="30" y="100" width="240" height="50" fill="oklch(0.96 0.005 95)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
    </svg>
  );
}

function ArtPublish() {
  return (
    <svg viewBox="0 0 300 180" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {/* URL bar */}
      <rect x="28" y="40" width="244" height="34" rx="17" fill="white" stroke="oklch(0.85 0.01 270)" strokeWidth="1.5" />
      <circle cx="50" cy="57" r="4" fill="oklch(0.65 0.13 150)" />
      <text x="64" y="61" fontSize="11" fill="oklch(0.45 0.02 270)" fontFamily="monospace">pathfinder.app/p/library</text>
      {/* QR code */}
      <g transform="translate(130, 90)">
        <rect x="0" y="0" width="60" height="60" fill="white" stroke="oklch(0.85 0.01 270)" strokeWidth="1.5" rx="4" />
        {/* QR-ish pattern */}
        <rect x="6" y="6" width="14" height="14" fill="oklch(0.22 0.02 270)" />
        <rect x="40" y="6" width="14" height="14" fill="oklch(0.22 0.02 270)" />
        <rect x="6" y="40" width="14" height="14" fill="oklch(0.22 0.02 270)" />
        <rect x="24" y="24" width="4" height="4" fill="oklch(0.22 0.02 270)" />
        <rect x="32" y="24" width="4" height="4" fill="oklch(0.22 0.02 270)" />
        <rect x="40" y="24" width="4" height="4" fill="oklch(0.22 0.02 270)" />
        <rect x="24" y="32" width="4" height="4" fill="oklch(0.22 0.02 270)" />
        <rect x="48" y="32" width="4" height="4" fill="oklch(0.22 0.02 270)" />
        <rect x="24" y="40" width="4" height="4" fill="oklch(0.22 0.02 270)" />
        <rect x="32" y="48" width="4" height="4" fill="oklch(0.22 0.02 270)" />
      </g>
    </svg>
  );
}

/* Section eyebrow (shared) */

function SectionEyebrow({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-overline">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--brand)" }}
        />
        {eyebrow}
      </span>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

/* Showcase: deep feature blocks */

function Showcase() {
  const { lang } = useLang();
  const isEl = lang === "el";
  return (
    <section className="flex w-full flex-col gap-24">
      <SectionEyebrow
        eyebrow={isEl ? "Δυνατότητες" : "Capabilities"}
        title={
          isEl
            ? "Σχεδιασμένο γύρω από κάθε επισκέπτη σας."
            : "Designed around every visitor you welcome."
        }
      />

      <ShowcaseBlock
        flip={false}
        eyebrow={isEl ? "Προσβασιμότητα" : "Accessibility"}
        title={
          isEl
            ? "Μία κάτοψη. Τρεις διαδρομές."
            : "One floor plan. Three routes."
        }
        body={
          isEl
            ? "Το ίδιο γράφημα παράγει διαφορετική απάντηση ανά προφίλ. Άτομο σε αμαξίδιο παρακάμπτει τις σκάλες, τυφλός χρήστης αποφεύγει στενά περάσματα. Πραγματική δρομολόγηση A*, όχι ευρετικές προσεγγίσεις."
            : "The same graph yields a different answer per profile. A wheelchair user routes around the stairwell, a visually-impaired one avoids narrow passages. Real A* pathfinding, not heuristics."
        }
        bullets={
          isEl
            ? [
                "Default · Αμαξίδιο · Προβλήματα όρασης",
                "Σκάλες = άπειρο για το αμαξίδιο",
                "Συμμόρφωση WCAG / ADA out of the box",
              ]
            : [
                "Default · Wheelchair · Visually impaired",
                "Stairs = infinity for the wheelchair profile",
                "WCAG / ADA-aligned out of the box",
              ]
        }
        Visual={VisualRouting}
      />

      <ShowcaseBlock
        flip
        eyebrow={isEl ? "Πολλοί όροφοι" : "Multi-floor"}
        title={
          isEl
            ? "Σκάλες και ασανσέρ ως ακμές του γραφήματος."
            : "Stairs and elevators as graph edges."
        }
        body={
          isEl
            ? "Συνδέστε κόμβους σκάλας ή ασανσέρ ενός ορόφου στους αντίστοιχους του επόμενου με ένα κλικ. Ο pathfinder φτιάχνει ένα ενιαίο γράφημα πολλών ορόφων και ο επισκέπτης βλέπει «Πάρτε το ασανσέρ προς τα πάνω» στη μέση της διαδρομής."
            : "Wire each stair / elevator node on one floor to the matching one on the next with a click. The pathfinder builds a unified multi-floor graph and the visitor sees “Take the elevator up” mid-route."
        }
        bullets={
          isEl
            ? [
                "Αυτόματη σύνδεση μέσω κωδικού δωματίου",
                "Αμφίδρομα ή μονόδρομα (έξοδος κινδύνου)",
                "Ο χάρτης αλλάζει όροφο μαζί με το βήμα",
              ]
            : [
                "Auto-link by matching room code",
                "Bidirectional or one-way (fire exits)",
                "Map auto-switches floor with the step",
              ]
        }
        Visual={VisualMultiFloor}
      />

      <ShowcaseBlock
        flip={false}
        eyebrow={isEl ? "Studio" : "Studio"}
        title={
          isEl
            ? "CAD-εργαλεία, χωρίς εκπαίδευση CAD."
            : "CAD-style tools, without CAD training."
        }
        body={
          isEl
            ? "Σαρωμένη κάτοψη ή PDF ως φόντο. Σχεδιάστε ακριβώς από πάνω με snap πλέγμα, άκρα, τομών και ορθογώνια. Πλήρης οθόνη, χωρίς distractions, ζωντανό zoom-adaptive grid."
            : "A scanned floor plan or PDF as tracing background. Trace right over it with grid, endpoint, ortho, and intersection snap. Full-screen studio, no distractions, zoom-adaptive grid."
        }
        bullets={
          isEl
            ? [
                "Πολυτμηματικοί τοίχοι, double-click για τέλος",
                "Πολύγωνα δωματίων + αυτόματη ανάθεση κόμβων",
                "Normalize: συγχωνεύει διπλούς κόμβους, σπάει επικαλύψεις",
              ]
            : [
                "Multi-segment walls, double-click to finish",
                "Room polygons + auto-assign nodes",
                "Normalize: merges duplicates, splits overlaps",
              ]
        }
        Visual={VisualEditor}
      />

      {/* Trust signals live at the foot of the capabilities section. */}
      <TrustStrip />
    </section>
  );
}

function ShowcaseBlock({
  flip,
  eyebrow,
  title,
  body,
  bullets,
  Visual,
}: {
  flip: boolean;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  Visual: React.ComponentType;
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={flip ? "md:order-2" : ""}>
        <p
          className="text-overline mb-3"
          style={{ color: "var(--brand)" }}
        >
          {eyebrow}
        </p>
        <h3 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-base text-[color:var(--muted-foreground)]">{body}</p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--brand)" }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={flip ? "md:order-1" : ""}>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-card)]">
          <Visual />
        </div>
      </div>
    </div>
  );
}

/* Showcase visuals */

function VisualRouting() {
  return (
    <div className="relative aspect-[5/4] w-full bg-[var(--surface-2)]">
      <svg
        viewBox="0 0 500 400"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Floor */}
        <rect x="0" y="0" width="500" height="400" fill="var(--surface-2)" />
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`vx${i}`} x1={i * 25} y1={0} x2={i * 25} y2={400} stroke="oklch(0.86 0.008 270)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={`vy${i}`} x1={0} y1={i * 25} x2={500} y2={i * 25} stroke="oklch(0.86 0.008 270)" strokeWidth="0.5" />
        ))}
        {/* Rooms */}
        <rect x="30" y="30" width="120" height="100" fill="oklch(0.94 0.025 250)" stroke="oklch(0.7 0.02 270)" />
        <rect x="170" y="30" width="140" height="100" fill="oklch(0.94 0.025 295)" stroke="oklch(0.7 0.02 270)" />
        <rect x="330" y="30" width="140" height="100" fill="oklch(0.93 0.04 330)" stroke="oklch(0.7 0.02 270)" />
        {/* Stairs */}
        <rect x="30" y="270" width="100" height="100" fill="oklch(0.92 0.04 30)" stroke="oklch(0.7 0.02 270)" />
        <text x="80" y="325" textAnchor="middle" fontSize="11" fill="oklch(0.3 0.02 270)" fontWeight={600}>STAIRS</text>
        {/* Elevator */}
        <rect x="150" y="270" width="100" height="100" fill="oklch(0.93 0.06 65)" stroke="oklch(0.7 0.02 270)" />
        <text x="200" y="325" textAnchor="middle" fontSize="11" fill="oklch(0.3 0.02 270)" fontWeight={600}>ELEV.</text>
        {/* Goal room */}
        <rect x="330" y="270" width="140" height="100" fill="oklch(0.94 0.04 80)" stroke="oklch(0.7 0.02 270)" />
        <text x="400" y="325" textAnchor="middle" fontSize="12" fill="oklch(0.3 0.02 270)" fontWeight={500}>Room 205</text>
        {/* Corridor */}
        <rect x="30" y="150" width="440" height="100" fill="oklch(0.96 0.005 95)" stroke="oklch(0.7 0.02 270)" />
        {/* Three routes */}
        {/* Default (shortest, through stairs) */}
        <polyline
          points="80,80 80,200 400,200 400,320"
          fill="none"
          stroke="oklch(0.55 0.21 285)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
          strokeDasharray="0"
        />
        {/* Wheelchair (via elevator) */}
        <polyline
          points="80,80 80,200 200,200 200,260 250,260 250,200 400,200 400,320"
          fill="none"
          stroke="oklch(0.62 0.13 215)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
          strokeDasharray="6 3"
        />
        {/* Visually-impaired (wider corridor preferred) */}
        <polyline
          points="80,80 80,170 470,170 470,320 400,320"
          fill="none"
          stroke="oklch(0.65 0.18 150)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
          strokeDasharray="2 4"
        />
        {/* Endpoints */}
        <circle cx="80" cy="80" r="9" fill="white" stroke="oklch(0.22 0.02 270)" strokeWidth="2.5" />
        <circle cx="400" cy="320" r="9" fill="white" stroke="oklch(0.22 0.02 270)" strokeWidth="2.5" />
      </svg>
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-[11px] shadow-sm">
        <LegendDot color="oklch(0.55 0.21 285)" label="Default" />
        <LegendDot color="oklch(0.62 0.13 215)" label="Wheelchair" />
        <LegendDot color="oklch(0.65 0.18 150)" label="Vis. impaired" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[color:var(--muted-foreground)]">{label}</span>
    </span>
  );
}

function VisualMultiFloor() {
  // Flat stacked floors — even 40px margin on every side of the viewBox.
  // Each floor: an outer plate + three rooms, the rightmost being the
  // elevator. A dashed shaft links the two elevators across floors.
  const rooms1 = [
    { x: 98, w: 92, fill: "oklch(0.94 0.025 295)", text: "WC" },
    { x: 198, w: 130, fill: "oklch(0.94 0.025 250)", text: "205" },
    { x: 336, w: 92, fill: "oklch(0.93 0.06 215)", text: "Elev." },
  ];
  const rooms0 = [
    { x: 98, w: 92, fill: "oklch(0.94 0.04 80)", text: "Lobby" },
    { x: 198, w: 130, fill: "oklch(0.94 0.025 250)", text: "101" },
    { x: 336, w: 92, fill: "oklch(0.93 0.06 215)", text: "Elev." },
  ];
  return (
    <div className="relative aspect-[5/4] w-full bg-[var(--surface-2)]">
      <svg
        viewBox="0 0 480 384"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Floor 1 (top) */}
        <rect x="86" y="48" width="354" height="128" fill="oklch(0.985 0.008 95)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
        {rooms1.map((r) => (
          <g key={`f1-${r.text}`}>
            <rect x={r.x} y="60" width={r.w} height="104" fill={r.fill} stroke="oklch(0.7 0.02 270)" />
            <text x={r.x + r.w / 2} y="116" textAnchor="middle" fontSize="12" fill="oklch(0.3 0.02 270)" fontWeight={500}>
              {r.text}
            </text>
          </g>
        ))}
        {/* Floor 0 (bottom) */}
        <rect x="86" y="208" width="354" height="128" fill="oklch(0.985 0.008 95)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
        {rooms0.map((r) => (
          <g key={`f0-${r.text}`}>
            <rect x={r.x} y="220" width={r.w} height="104" fill={r.fill} stroke="oklch(0.7 0.02 270)" />
            <text x={r.x + r.w / 2} y="276" textAnchor="middle" fontSize="12" fill="oklch(0.3 0.02 270)" fontWeight={500}>
              {r.text}
            </text>
          </g>
        ))}

        {/* Level badges in the left column */}
        <g>
          <rect x="40" y="101" width="34" height="22" rx="5" fill="var(--brand)" />
          <text x="57" y="116" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight={700} fill="white">L1</text>
          <rect x="40" y="261" width="34" height="22" rx="5" fill="var(--brand)" />
          <text x="57" y="276" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight={700} fill="white">L0</text>
        </g>

        {/* Elevator shaft linking the two elevator rooms */}
        <g>
          <line x1="382" y1="164" x2="382" y2="220" stroke="oklch(0.55 0.13 215)" strokeWidth="3" strokeDasharray="5 4" />
          <circle cx="382" cy="164" r="7" fill="white" stroke="oklch(0.55 0.13 215)" strokeWidth="2.5" />
          <circle cx="382" cy="220" r="7" fill="white" stroke="oklch(0.55 0.13 215)" strokeWidth="2.5" />
          <path
            d="M 382 200 L 382 184 M 377 189 L 382 184 L 387 189"
            stroke="oklch(0.55 0.13 215)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}

function VisualEditor() {
  return (
    <div className="relative aspect-[5/4] w-full">
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.13_27)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.86_0.13_75)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.13_150)]" />
        <span className="ml-3 truncate text-[11px] text-[color:var(--muted-foreground)]">
          studio · drawing
        </span>
      </div>
      <svg
        viewBox="0 0 500 320"
        className="h-full w-full bg-[var(--surface-2)]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Tool palette */}
        <g>
          <rect x="0" y="0" width="56" height="320" fill="var(--background)" stroke="oklch(0.9 0.01 270)" strokeWidth="1" />
          {[40, 90, 140, 190, 240].map((y, i) => (
            <rect
              key={i}
              x="10"
              y={y - 4}
              width="36"
              height="36"
              rx="6"
              fill={i === 1 ? "var(--brand-soft)" : "transparent"}
              stroke={i === 1 ? "var(--brand)" : "oklch(0.85 0.01 270)"}
              strokeWidth={i === 1 ? "1.5" : "1"}
            />
          ))}
          {/* Tool glyphs */}
          <path d="M 24 36 L 28 32 L 36 40 L 32 44 Z" fill="oklch(0.4 0.02 270)" />
          <path d="M 20 96 L 36 96 M 24 90 L 24 102 M 32 90 L 32 102" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="28" cy="146" r="6" fill="oklch(0.4 0.02 270)" />
          <path d="M 18 196 L 38 196" stroke="oklch(0.4 0.02 270)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 244 L 34 244 M 28 238 L 28 250" stroke="oklch(0.4 0.02 270)" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Canvas grid */}
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`cx${i}`} x1={56 + i * 25} y1={0} x2={56 + i * 25} y2={320} stroke="oklch(0.86 0.008 270)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`cy${i}`} x1={56} y1={i * 25} x2={500} y2={i * 25} stroke="oklch(0.86 0.008 270)" strokeWidth="0.5" />
        ))}
        {/* Drawn rooms */}
        <rect x="90" y="40" width="140" height="100" fill="oklch(0.94 0.025 250)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
        <rect x="240" y="40" width="170" height="100" fill="oklch(0.94 0.025 295)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
        <rect x="90" y="200" width="320" height="80" fill="oklch(0.96 0.005 95)" stroke="oklch(0.22 0.02 270)" strokeWidth="2" />
        <text x="160" y="95" textAnchor="middle" fontSize="11" fill="oklch(0.3 0.02 270)" fontWeight={500}>101</text>
        <text x="325" y="95" textAnchor="middle" fontSize="11" fill="oklch(0.3 0.02 270)" fontWeight={500}>Lab</text>
        <text x="250" y="245" textAnchor="middle" fontSize="11" fill="oklch(0.3 0.02 270)" fontWeight={500}>Corridor</text>
        {/* In-progress wall line with cursor */}
        <line x1="160" y1="140" x2="160" y2="200" stroke="var(--brand)" strokeWidth="3" strokeDasharray="6 4" />
        <circle cx="160" cy="140" r="4" fill="white" stroke="var(--brand)" strokeWidth="2" />
        {/* Cursor crosshair */}
        <g transform="translate(160, 200)">
          <line x1="-6" y1="0" x2="6" y2="0" stroke="var(--brand)" strokeWidth="2" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke="var(--brand)" strokeWidth="2" />
        </g>
        {/* Snap badge */}
        <g transform="translate(180, 200)">
          <rect x="0" y="-9" width="44" height="18" rx="9" fill="var(--brand)" />
          <text x="22" y="3" textAnchor="middle" fontSize="9" fill="white" fontWeight={700}>
            snap
          </text>
        </g>
      </svg>
    </div>
  );
}

/* Trust strip */

function TrustStrip() {
  const { lang } = useLang();
  const isEl = lang === "el";
  const items = isEl
    ? [
        { Icon: Accessibility, label: "Συμμόρφωση WCAG 2.2" },
        { Icon: ShieldCheck, label: "Multi-tenant με Google OAuth" },
        { Icon: Code2, label: "Open source στο GitHub" },
        { Icon: Languages, label: "Διγλωσσία EN / EL" },
        { Icon: Globe, label: "Έτοιμο για παγκόσμια χρήση" },
      ]
    : [
        { Icon: Accessibility, label: "WCAG 2.2 aligned" },
        { Icon: ShieldCheck, label: "Multi-tenant w/ Google OAuth" },
        { Icon: Code2, label: "Open-source on GitHub" },
        { Icon: Languages, label: "Bilingual EN / EL" },
        { Icon: Globe, label: "Ready for global use" },
      ];
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-sm sm:grid-cols-3 sm:gap-x-10 md:grid-cols-5 md:p-8">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2.5">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[color:var(--brand)]"
              style={{ background: "var(--brand-soft)" }}
            >
              <it.Icon className="h-4 w-4" />
            </span>
            <span className="text-[color:var(--foreground)]">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Audience */

function Audience() {
  const { lang } = useLang();
  const isEl = lang === "el";
  const tags = isEl
    ? ["Πανεπιστήμια", "Νοσοκομεία", "Μουσεία", "Βιβλιοθήκες", "Γραφεία", "Δημοτικά κτίρια"]
    : ["Universities", "Hospitals", "Museums", "Libraries", "Offices", "Civic buildings"];
  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      <p className="text-overline">{isEl ? "Φτιαγμένο για" : "Built for"}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-1.5 text-sm text-[color:var(--foreground)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Closing CTA */

function ClosingCta({ isAuthed }: { isAuthed: boolean }) {
  const { lang } = useLang();
  const isEl = lang === "el";
  return (
    <section className="flex w-full flex-col items-center gap-5 text-center">
      <Compass className="h-8 w-8 text-[color:var(--brand)]" />
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {isEl ? "Δοκιμάστε σε ένα κτίριό σας." : "Try it on one of your buildings."}
      </h2>
      <p className="text-balance max-w-[40ch] text-base text-[color:var(--muted-foreground)]">
        {isEl
          ? "Λογαριασμός σε δευτερόλεπτα. Πρώτος όροφος σε λίγα λεπτά."
          : "Account in seconds. First floor in minutes."}
      </p>

      <div className="my-2 w-full max-w-2xl">
        <Audience />
      </div>

      <Link
        href={isAuthed ? "/dashboard" : "/signin"}
        className="group inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[color:var(--background)] hover:opacity-90"
      >
        {isAuthed
          ? isEl ? "Στο dashboard" : "Open dashboard"
          : isEl ? "Ξεκινήστε" : "Get started"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}

/* Footer */

function Footer() {
  const { lang } = useLang();
  const isEl = lang === "el";
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-[color:var(--muted-foreground)] sm:px-8">
        <p>
          {isEl ? "Pathfinder · " : "Pathfinder · "}
          {isEl
            ? "Φτιαγμένο από το UoM Research Lab"
            : "Built by the UoM Research Lab"}
        </p>
        <div className="flex items-center gap-4">
          <Link href="/signin" className="hover:text-[color:var(--foreground)]">
            {isEl ? "Σύνδεση" : "Sign in"}
          </Link>
          <a
            href="https://github.com/University-of-Macedonia-Research-Lab/pathfinder"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 hover:text-[color:var(--foreground)]"
          >
            GitHub <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
