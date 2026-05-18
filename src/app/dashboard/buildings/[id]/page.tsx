import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  Network,
  PenTool,
  Plus,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloorRowMenu } from "@/components/floor-row-menu";
import { BuildingMenu } from "@/components/building-menu";
import { FloorCarousel, type CarouselFloor } from "@/components/floor-carousel";
import { publishBuilding, unpublishBuilding } from "@/app/dashboard/actions";
import { parseFloorMap, type FloorMap } from "@/lib/map/schema";

type FloorRow = {
  id: string;
  slug: string;
  level: number;
  nameEn: string;
  nameEl: string;
  stats: { rooms: number; walls: number; doors: number; nodes: number; edges: number };
  map: FloorMap;
};

export default async function BuildingPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const user = await requireUser();
  const building = await prisma.building.findFirst({
    where: { id, ownerId: user.id },
    include: { floors: { orderBy: { level: "asc" } } },
  });
  if (!building) notFound();

  const isPublished = building.status === "published";

  const floors: FloorRow[] = building.floors.map((f) => {
    const map = parseFloorMap(JSON.parse(f.data));
    return {
      id: f.id,
      slug: f.slug,
      level: f.level,
      nameEn: f.nameEn,
      nameEl: f.nameEl,
      map,
      stats: {
        rooms: map.rooms.length,
        walls: map.walls.length,
        doors: map.doors.length,
        nodes: map.nodes.length,
        edges: map.edges.length,
      },
    };
  });

  const carouselFloors: CarouselFloor[] = floors.map((f) => ({
    id: f.id,
    level: f.level,
    nameEn: f.nameEn,
    map: f.map,
  }));

  // "Open studio" enters the editor at the lowest floor — the in-studio
  // floor switcher handles getting anywhere else from there.
  const entryFloor = floors[0] ?? null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All buildings
        </Link>
        {entryFloor && (
          <Link
            href={`/dashboard/buildings/${building.id}/floors/${entryFloor.id}/edit`}
          >
            <Button className="gap-1.5">
              <PenTool className="h-4 w-4" />
              Open studio
            </Button>
          </Link>
        )}
      </div>

      <Hero
        building={building}
        floorCount={floors.length}
        isPublished={isPublished}
        carouselFloors={carouselFloors}
      />

      <FloorsSection buildingId={building.id} floors={floors} />
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */

function Hero({
  building,
  floorCount,
  isPublished,
  carouselFloors,
}: {
  building: {
    id: string;
    slug: string;
    nameEn: string;
    nameEl: string;
    description: string | null;
    publicSlug: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
  };
  floorCount: number;
  isPublished: boolean;
  carouselFloors: CarouselFloor[];
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-soft)" }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-10">
        {/* Left: properties + actions */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-overline" style={{ color: "var(--brand)" }}>
              Building
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-h1">{building.nameEn}</h1>
              <Badge tone={isPublished ? "success" : "muted"}>
                {isPublished ? "published" : "draft"}
              </Badge>
            </div>
            <p className="text-caption">{building.nameEl}</p>
            {building.description && (
              <p className="text-body mt-1 max-w-prose text-[color:var(--muted-foreground)]">
                {building.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form
              action={async () => {
                "use server";
                if (isPublished) await unpublishBuilding(building.id);
                else await publishBuilding(building.id);
              }}
            >
              <Button
                type="submit"
                variant={isPublished ? "outline" : "default"}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                {isPublished ? "Unpublish" : "Publish"}
              </Button>
            </form>
            {isPublished && building.publicSlug && (
              <Link href={`/p/${building.publicSlug}`} target="_blank">
                <Button variant="outline" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  View public
                </Button>
              </Link>
            )}
            <BuildingMenu
              building={{
                id: building.id,
                slug: building.slug,
                nameEn: building.nameEn,
                nameEl: building.nameEl,
                description: building.description,
                publicSlug: building.publicSlug,
              }}
            />
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-5">
            <StatTile Icon={Layers} label="Floors" value={floorCount} />
            <StatTile
              Icon={Sparkles}
              label="Status"
              text={
                isPublished
                  ? building.publishedAt
                    ? `Live · ${formatRelative(building.publishedAt)}`
                    : "Live"
                  : "Draft only"
              }
              accent={isPublished}
            />
            <StatTile
              Icon={Network}
              label="Last edit"
              text={formatRelative(building.updatedAt)}
            />
          </dl>

          {isPublished && building.publicSlug && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs">
              <span className="text-[color:var(--muted-foreground)]">
                Public URL
              </span>
              <code className="font-mono text-[color:var(--foreground)]">
                /p/{building.publicSlug}
              </code>
              <Link
                href={`/p/${building.publicSlug}`}
                target="_blank"
                className="ml-auto inline-flex items-center gap-1 text-[color:var(--brand)] hover:underline"
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Right: floor carousel */}
        <FloorCarousel floors={carouselFloors} />
      </div>
    </section>
  );
}

function StatTile({
  Icon,
  label,
  value,
  text,
  accent,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  text?: string;
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
        <dd
          className={
            "truncate text-base font-semibold leading-none tracking-tight " +
            (accent
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-[color:var(--foreground)]")
          }
        >
          {value !== undefined ? value : text}
        </dd>
        <dt className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          {label}
        </dt>
      </div>
    </div>
  );
}

/* ─── Floors ─────────────────────────────────────────────────────────────── */

function FloorsSection({
  buildingId,
  floors,
}: {
  buildingId: string;
  floors: FloorRow[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2">Floors</h2>
          <p className="text-caption">
            Each floor holds its own rooms, walls, and routing graph.
          </p>
        </div>
        <Link href={`/dashboard/buildings/${buildingId}/floors/new`}>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add floor
          </Button>
        </Link>
      </div>

      {floors.length === 0 ? (
        <FloorEmptyState buildingId={buildingId} />
      ) : (
        <ul className="flex flex-col gap-3">
          {floors.map((f) => (
            <FloorRow key={f.id} buildingId={buildingId} floor={f} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FloorEmptyState({ buildingId }: { buildingId: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center sm:p-12">
      <div
        className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-[color:var(--brand)]"
        style={{ background: "var(--brand-soft)" }}
      >
        <Layers className="h-6 w-6" />
      </div>
      <h3 className="text-h3">No floors yet</h3>
      <p className="text-caption mx-auto mt-1 max-w-sm">
        Start with a ground floor. You can rename it and add more later.
      </p>
      <div className="mt-5">
        <Link href={`/dashboard/buildings/${buildingId}/floors/new`}>
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Add first floor
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FloorRow({
  buildingId,
  floor,
}: {
  buildingId: string;
  floor: FloorRow;
}) {
  const { stats } = floor;
  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-[var(--brand)]/30 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-semibold text-[color:var(--brand)]"
          style={{ background: "var(--brand-soft)" }}
        >
          L{floor.level}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {floor.nameEn}
            </h3>
            <span className="truncate text-xs text-[color:var(--muted-foreground)]">
              {floor.nameEl}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--muted-foreground)]">
            <span className="font-mono">/{floor.slug}</span>
            <span aria-hidden>·</span>
            <span>
              {stats.rooms} rooms · {stats.walls} walls · {stats.doors} doors ·{" "}
              {stats.nodes} nodes · {stats.edges} edges
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <FloorRowMenu
            buildingId={buildingId}
            floor={{
              id: floor.id,
              slug: floor.slug,
              level: floor.level,
              nameEn: floor.nameEn,
              nameEl: floor.nameEl,
            }}
          />
        </div>
      </div>
    </li>
  );
}

/* ─── Utilities ──────────────────────────────────────────────────────────── */

function formatRelative(d: Date): string {
  const ms = Date.now() - d.getTime();
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
