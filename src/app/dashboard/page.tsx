import Link from "next/link";
import { ArrowRight, Building2, Layers, Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await requireUser();
  const buildings = await prisma.building.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { floors: true } } },
  });

  const publishedCount = buildings.filter((b) => b.status === "published").length;
  const floorCount = buildings.reduce((acc, b) => acc + b._count.floors, 0);
  const firstName =
    user.name?.split(" ")[0] ??
    (user.email ? user.email.split("@")[0] : null);

  return (
    <div className="flex flex-col gap-10">
      <Greeting
        firstName={firstName}
        stats={{
          buildings: buildings.length,
          published: publishedCount,
          floors: floorCount,
        }}
      />

      {buildings.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">All buildings</h2>
            <Link href="/dashboard/buildings/new">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                New building
              </Button>
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildings.map((b) => (
              <BuildingCard
                key={b.id}
                id={b.id}
                nameEn={b.nameEn}
                nameEl={b.nameEl}
                slug={b.slug}
                status={b.status}
                floors={b._count.floors}
                updatedAt={b.updatedAt}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Greeting({
  firstName,
  stats,
}: {
  firstName: string | null;
  stats: { buildings: number; published: number; floors: number };
}) {
  const isEmpty = stats.buildings === 0;
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Soft brand-soft wash on the right — same vocabulary as the homepage
          hero. Keeps the dashboard feeling like part of the same product. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-soft)" }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-overline" style={{ color: "var(--brand)" }}>
            Pathfinder
          </p>
          <h1 className="text-h1">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </h1>
          <p className="text-lead max-w-xl">
            {isEmpty
              ? "Create your first building, draw a floor, publish it at a URL — a complete pass takes about an afternoon."
              : "Pick a building to edit, or add a new one. Everything you save is live the moment you publish."}
          </p>
        </div>
        <Link href="/dashboard/buildings/new">
          <Button size="lg" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            New building
          </Button>
        </Link>
      </div>

      {!isEmpty && (
        <dl className="relative mt-6 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-6">
          <Stat
            Icon={Building2}
            label="Buildings"
            value={stats.buildings}
          />
          <Stat
            Icon={Sparkles}
            label="Published"
            value={stats.published}
            accent
          />
          <Stat
            Icon={Layers}
            label="Floors"
            value={stats.floors}
          />
        </dl>
      )}
    </section>
  );
}

function Stat({
  Icon,
  label,
  value,
  accent,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[color:var(--brand)]"
        style={{ background: "var(--brand-soft)" }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <dd className="text-2xl font-semibold leading-none tracking-tight">
          {value}
          {accent && value > 0 && (
            <span className="ml-1.5 align-middle text-xs font-normal text-emerald-700 dark:text-emerald-300">
              live
            </span>
          )}
        </dd>
        <dt className="mt-1 text-xs text-[color:var(--muted-foreground)]">{label}</dt>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center sm:p-14">
      <div
        className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-[color:var(--brand)]"
        style={{ background: "var(--brand-soft)" }}
      >
        <Building2 className="h-7 w-7" />
      </div>
      <h2 className="text-h2">No buildings yet</h2>
      <p className="text-lead mx-auto mt-2 max-w-md">
        A building holds your floors, rooms, and the routing graph that powers
        wayfinding. Start with one.
      </p>
      <div className="mt-6">
        <Link href="/dashboard/buildings/new">
          <Button size="lg">
            <Plus className="mr-1.5 h-4 w-4" />
            Create your first building
          </Button>
        </Link>
      </div>
    </section>
  );
}

function BuildingCard({
  id,
  nameEn,
  nameEl,
  slug,
  status,
  floors,
  updatedAt,
}: {
  id: string;
  nameEn: string;
  nameEl: string;
  slug: string;
  status: string;
  floors: number;
  updatedAt: Date;
}) {
  const isPublished = status === "published";
  return (
    <li>
      <Link
        href={`/dashboard/buildings/${id}`}
        className="group block h-full rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--brand)]/30 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[color:var(--brand)]"
            style={{ background: "var(--brand-soft)" }}
          >
            <Building2 className="h-4 w-4" />
          </span>
          <Badge tone={isPublished ? "success" : "muted"}>{status}</Badge>
        </div>
        <h3 className="mt-4 truncate text-lg font-semibold tracking-tight">
          {nameEn}
        </h3>
        <p className="truncate text-sm text-[color:var(--muted-foreground)]">
          {nameEl}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            {floors} floor{floors === 1 ? "" : "s"}
          </span>
          <span className="truncate font-mono">/{slug}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-[color:var(--muted-foreground)]">
            Updated {formatRelative(updatedAt)}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[color:var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
            Open
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </li>
  );
}

function formatRelative(d: Date): string {
  const now = Date.now();
  const ms = now - d.getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.round(mo / 12);
  return `${yr}y ago`;
}
