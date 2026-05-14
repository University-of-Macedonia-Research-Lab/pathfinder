"use client";

/**
 * Floor demo screen.
 *
 * Layout: a real left sidebar (via AppShell.sidebar) holds the controls
 * and the map fills the rest of the viewport. Sidebar surface matches
 * the map's so the panel reads as part of the same canvas.
 *
 * Sidebar UX is two tabs:
 *   - Explore — read the map: floor switcher, display toggles, stats.
 *   - Navigate — go somewhere: pick a profile + From/To (or ask the
 *                assistant), then transition to a step-by-step
 *                directions view. "Back" returns to the settings.
 *
 * The directions list in this commit is a deliberate stub — it walks
 * the multi-floor path and emits a step for each meaningful waypoint
 * (start, room arrivals, elevator/stairs, floor changes, end). Phase 2
 * will replace it with a real turn-by-turn synthesiser.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CornerRightDown,
  CornerUpLeft,
  CornerUpRight,
  Eraser,
  Eye,
  Flag,
  Info,
  MapPin,
  MoveRight,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FloorMap } from "./floor-map";
import { AssistantPanel } from "./assistant-panel";
import { PROFILES, type Profile } from "@/lib/map/pathfind";
import {
  findMultiFloorRouteBetweenRooms,
  type MultiFloorPath,
} from "@/lib/map/multi-pathfind";
import type { FloorMap as FloorMapData } from "@/lib/map/schema";
import { buildDirections, type Step } from "@/lib/map/directions";
import { useLang, type Lang } from "@/lib/i18n";

const PROFILE_LIST = Object.values(PROFILES);

type Props = {
  buildingSlug: string;
  /** Identifier used by the public assistant API to look up the building. */
  publicSlug: string;
  floors: FloorMapData[];
  currentFloorSlug: string;
};

type RoomRef = { floor: string; room: string };
type Tab = "explore" | "navigate";
type NavView = "settings" | "directions";

function profileLabel(p: Profile, lang: Lang): string {
  return lang === "el" ? p.labelEl : p.label;
}

function prettyBuildingName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function FloorScreen({
  buildingSlug,
  publicSlug,
  floors,
  currentFloorSlug,
}: Props) {
  const { lang } = useLang();
  const isEl = lang === "el";
  const t = isEl
    ? {
        controls: "Έλεγχοι χάρτη",
        explore: "Εξερεύνηση",
        navigate: "Πλοήγηση",
      }
    : {
        controls: "Map controls",
        explore: "Explore",
        navigate: "Navigate",
      };

  const allRoomOptions = useMemo(
    () =>
      floors.flatMap((f) =>
        f.rooms
          .filter((r) => r.kind !== "corridor")
          .map((r) => ({
            value: `${f.floorSlug}|${r.id}`,
            floor: f.floorSlug,
            room: r.id,
            label: r.code ? `${r.code} · ${r.name[lang]}` : r.name[lang],
            floorName: f.name[lang],
          })),
      ),
    [floors, lang],
  );

  // Page boots with no route — the form is empty and the map shows just
  // the floor plan. The user picks From/To (or asks the assistant) to
  // generate a route.
  const EMPTY_REF: RoomRef = { floor: "", room: "" };
  const [fromRef, setFromRefState] = useState<RoomRef>(EMPTY_REF);
  const [toRef, setToRefState] = useState<RoomRef>(EMPTY_REF);
  const [profileId, setProfileIdState] = useState<string>("default");
  const [showGraph, setShowGraph] = useState(false);
  const [aiPath, setAiPath] = useState<MultiFloorPath | null>(null);

  const [tab, setTab] = useState<Tab>("navigate");
  const [navView, setNavView] = useState<NavView>("settings");

  // Floor switching is local now (not URL navigation) so route + step
  // selection state survive across floor changes triggered by clicking
  // a directions step or a floor in the explore list.
  const [displayedFloorSlug, setDisplayedFloorSlug] = useState(currentFloorSlug);
  useEffect(() => {
    setDisplayedFloorSlug(currentFloorSlug);
  }, [currentFloorSlug]);

  const currentFloor =
    floors.find((f) => f.floorSlug === displayedFloorSlug) ?? floors[0];

  // Step the user has clicked in the directions list. Cleared whenever
  // the active path changes (a new path = new step indices).
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(null);

  const setFromRef = (v: RoomRef) => {
    setFromRefState(v);
    setAiPath(null);
    setSelectedStepIdx(null);
  };
  const setToRef = (v: RoomRef) => {
    setToRefState(v);
    setAiPath(null);
    setSelectedStepIdx(null);
  };
  const setProfileId = (v: string) => {
    setProfileIdState(v);
    setAiPath(null);
    setSelectedStepIdx(null);
  };

  const profile: Profile = PROFILES[profileId] ?? PROFILES.default;

  const manualPath = useMemo(() => {
    if (!fromRef.room || !toRef.room) return null;
    if (fromRef.floor === toRef.floor && fromRef.room === toRef.room) return null;
    return findMultiFloorRouteBetweenRooms(floors, fromRef, toRef, profile);
  }, [floors, fromRef, toRef, profile]);

  const activePath: MultiFloorPath | null = aiPath ?? manualPath;

  // When the assistant returns a route, jump straight into the directions
  // view so the user sees the answer instead of having to click through
  // the form again. Also mirror the assistant's chosen endpoints into the
  // manual From/To selects so flipping back to Settings reflects what was
  // asked (and the user can tweak it from there).
  useEffect(() => {
    if (!aiPath) return;
    setTab("navigate");
    setNavView("directions");

    const segs = aiPath.segments;
    if (segs.length === 0) return;
    const firstSeg = segs[0];
    const lastSeg = segs[segs.length - 1];
    const firstNodeId = firstSeg.nodes[0];
    const lastNodeId = lastSeg.nodes[lastSeg.nodes.length - 1];
    const firstFloor = floors.find((f) => f.floorSlug === firstSeg.floorSlug);
    const lastFloor = floors.find((f) => f.floorSlug === lastSeg.floorSlug);
    const fromRoomId = firstFloor?.nodes.find((n) => n.id === firstNodeId)?.roomId;
    const toRoomId = lastFloor?.nodes.find((n) => n.id === lastNodeId)?.roomId;
    // Bypass the setFromRef/setToRef wrappers — those clear aiPath, which
    // would defeat the whole point here.
    if (fromRoomId) setFromRefState({ floor: firstSeg.floorSlug, room: fromRoomId });
    if (toRoomId) setToRefState({ floor: lastSeg.floorSlug, room: toRoomId });
  }, [aiPath, floors]);

  const currentSegmentNodes = useMemo(() => {
    if (!activePath) return undefined;
    const segs = activePath.segments.filter(
      (s) => s.floorSlug === displayedFloorSlug,
    );
    if (segs.length === 0) return undefined;
    return segs.flatMap((s) => s.nodes);
  }, [activePath, displayedFloorSlug]);

  // Compute directions at the page level so we can drive both the panel
  // (which renders them) and the step-selection state (which lives here).
  const directionsSteps = useMemo(
    () =>
      activePath ? buildDirections(activePath, fromRef, toRef, floors, lang) : [],
    [activePath, fromRef, toRef, floors, lang],
  );

  // Clear the step selection whenever the route changes — old indices
  // would point to a different step.
  useEffect(() => {
    setSelectedStepIdx(null);
  }, [activePath]);

  // The node id to pulse on the map: only when the selected step lives
  // on the floor we're currently displaying.
  const emphasisedNodeId = useMemo(() => {
    if (selectedStepIdx === null) return undefined;
    const step = directionsSteps[selectedStepIdx];
    if (!step) return undefined;
    if (step.floorSlug !== displayedFloorSlug) return undefined;
    return step.nodeId;
  }, [selectedStepIdx, directionsSteps, displayedFloorSlug]);

  const handleSelectStep = (idx: number) => {
    setSelectedStepIdx(idx);
    const step = directionsSteps[idx];
    if (step && step.floorSlug !== displayedFloorSlug) {
      setDisplayedFloorSlug(step.floorSlug);
    }
  };

  // Below lg, the sidebar collapses into a bottom-sheet pattern: a fixed
  // bottom nav with Explore / Navigate is always visible, and tapping a tab
  // slides up a sheet with the matching panel. Feels native on phones and
  // keeps the map fully visible at idle.
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const onMobileTabClick = (next: Tab) => {
    if (mobileSheetOpen && tab === next) {
      setMobileSheetOpen(false);
    } else {
      setTab(next);
      setMobileSheetOpen(true);
    }
  };

  // The active panel — extracted so we can render it both in the desktop
  // sidebar (with the Tabs control on top) and in the mobile bottom sheet
  // (where the bottom nav already plays the tab-switcher role).
  const panel =
    tab === "explore" ? (
      <ExplorePanel
        lang={lang}
        floors={floors}
        currentFloor={currentFloor}
        displayedFloorSlug={displayedFloorSlug}
        onSelectFloor={(slug) => {
          setDisplayedFloorSlug(slug);
          setSelectedStepIdx(null);
        }}
        buildingSlug={buildingSlug}
        showGraph={showGraph}
        onShowGraphChange={setShowGraph}
      />
    ) : navView === "directions" && activePath ? (
      <DirectionsPanel
        lang={lang}
        steps={directionsSteps}
        selectedIdx={selectedStepIdx}
        onSelectStep={handleSelectStep}
        path={activePath}
        floors={floors}
        displayedFloorSlug={displayedFloorSlug}
        profile={profile}
        aiAuthored={Boolean(aiPath)}
        onBack={() => setNavView("settings")}
      />
    ) : (
      <NavigateSettings
        lang={lang}
        fromRef={fromRef}
        toRef={toRef}
        options={allRoomOptions}
        profileId={profileId}
        onFromChange={setFromRef}
        onToChange={setToRef}
        onProfileChange={setProfileId}
        onSwap={() => {
          setFromRefState(toRef);
          setToRefState(fromRef);
          setAiPath(null);
          setSelectedStepIdx(null);
        }}
        onClear={() => {
          // Empty `room` makes RoomSelect render its placeholder; the
          // existing manualPath check (`!fromRef.room || !toRef.room`)
          // already short-circuits routing on empty refs.
          setFromRefState(EMPTY_REF);
          setToRefState(EMPTY_REF);
          setAiPath(null);
          setSelectedStepIdx(null);
        }}
        onShowDirections={() => setNavView("directions")}
        activePath={activePath}
        publicSlug={publicSlug}
        currentFloorSlug={currentFloorSlug}
        onAssistantRoute={(p, profileId) => {
          setAiPath(p);
          // Mirror the assistant's profile choice into the manual
          // selector so "I use a wheelchair" flips the profile too.
          // Bypass setProfileId — that wrapper clears aiPath.
          if (profileId && PROFILES[profileId]) {
            setProfileIdState(profileId);
          }
        }}
      />
    );

  const sidebar = (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tab}
        onChange={setTab}
        labels={{ explore: t.explore, navigate: t.navigate }}
      />
      {panel}
    </div>
  );

  return (
    <AppShell
      headerSlot={
        <span className="text-[color:var(--muted-foreground)]">
          {prettyBuildingName(buildingSlug)} · {currentFloor.name[lang]}
        </span>
      }
      sidebar={sidebar}
      sidebarTitle={t.controls}
      mobileSidebar="none"
    >
      {/* Leave room at the bottom on phones so the fixed nav doesn't
          cover the corner of the map. Match the nav's actual height,
          including the iOS home-indicator safe area. */}
      <div className="relative h-full pb-[calc(env(safe-area-inset-bottom)+3.5rem)] lg:pb-0">
        <FloorMap
          map={currentFloor}
          showGraph={showGraph}
          highlightedRoute={currentSegmentNodes}
          emphasisedNodeId={emphasisedNodeId}
          lang={lang}
        />
      </div>

      <MobileBottomNav
        tab={tab}
        sheetOpen={mobileSheetOpen}
        onTabClick={onMobileTabClick}
        labels={{ explore: t.explore, navigate: t.navigate }}
      />

      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[80vh] rounded-t-2xl border-t border-[var(--border)] bg-[var(--surface-1)] p-0 lg:hidden"
        >
          <SheetTitle className="sr-only">{t.controls}</SheetTitle>
          <SheetDescription className="sr-only">
            {lang === "el"
              ? "Έλεγχοι χάρτη και βοηθός"
              : "Map controls and assistant"}
          </SheetDescription>
          {/* Drag handle (decorative — drag-to-dismiss isn't wired) */}
          <div className="mx-auto mt-2 mb-1 h-1.5 w-10 rounded-full bg-[var(--border)]" />
          <div className="flex flex-col gap-4 overflow-y-auto px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
            {panel}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

/* ─── Tabs ────────────────────────────────────────────────────────────────── */

function Tabs({
  value,
  onChange,
  labels,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
  labels: { explore: string; navigate: string };
}) {
  return (
    <div
      role="tablist"
      className="flex rounded-xl border border-[var(--border)] bg-[var(--background)] p-0.5"
    >
      <TabButton
        active={value === "explore"}
        onClick={() => onChange("explore")}
        icon={<Eye className="h-3.5 w-3.5" />}
        label={labels.explore}
      />
      <TabButton
        active={value === "navigate"}
        onClick={() => onChange("navigate")}
        icon={<Navigation className="h-3.5 w-3.5" />}
        label={labels.navigate}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors " +
        (active
          ? "bg-[var(--brand)] text-white shadow-[var(--shadow-card)]"
          : "text-[color:var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[color:var(--foreground)]")
      }
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── Mobile bottom nav ───────────────────────────────────────────────────── */

/**
 * Bottom-of-screen tab bar shown below `lg`. Always visible so the user
 * can swap panels (or dismiss the sheet) without hunting for a burger.
 * Tapping the active tab while its sheet is open closes the sheet.
 */
function MobileBottomNav({
  tab,
  sheetOpen,
  onTabClick,
  labels,
}: {
  tab: Tab;
  sheetOpen: boolean;
  onTabClick: (next: Tab) => void;
  labels: { explore: string; navigate: string };
}) {
  return (
    <nav
      role="tablist"
      aria-label={labels.explore + " / " + labels.navigate}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 supports-backdrop-filter:bg-[var(--background)]/80 supports-backdrop-filter:backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 lg:hidden"
    >
      <div className="mx-auto flex max-w-md gap-1 px-3">
        <BottomNavButton
          active={sheetOpen && tab === "explore"}
          onClick={() => onTabClick("explore")}
          icon={<Eye className="h-4 w-4" />}
          label={labels.explore}
        />
        <BottomNavButton
          active={sheetOpen && tab === "navigate"}
          onClick={() => onTabClick("navigate")}
          icon={<Navigation className="h-4 w-4" />}
          label={labels.navigate}
        />
      </div>
    </nav>
  );
}

function BottomNavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[0.7rem] font-semibold transition-colors " +
        (active
          ? "bg-[var(--brand-soft)] text-[color:var(--brand)]"
          : "text-[color:var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[color:var(--foreground)]")
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ─── Explore tab ─────────────────────────────────────────────────────────── */

function ExplorePanel({
  lang,
  floors,
  currentFloor,
  displayedFloorSlug,
  onSelectFloor,
  buildingSlug,
  showGraph,
  onShowGraphChange,
}: {
  lang: Lang;
  floors: FloorMapData[];
  currentFloor: FloorMapData;
  displayedFloorSlug: string;
  onSelectFloor: (slug: string) => void;
  buildingSlug: string;
  showGraph: boolean;
  onShowGraphChange: (v: boolean) => void;
}) {
  const isEl = lang === "el";
  const t = isEl
    ? {
        floor: "Όροφος",
        display: "Εμφάνιση",
        graphLabel: "Εμφάνιση γραφήματος δρομολόγησης",
        graphHint: "Επικάλυψη κόμβων και ακμών πάνω στην κάτοψη.",
        info: "Στοιχεία",
        rooms: "Δωμάτια",
        doors: "Πόρτες",
        nodes: "Κόμβοι",
        edges: "Ακμές",
        building: "Κτίριο",
        howWorks: "Πώς λειτουργεί;",
      }
    : {
        floor: "Floor",
        display: "Display",
        graphLabel: "Show routing graph",
        graphHint: "Overlay nodes and edges over the floor plan.",
        info: "Info",
        rooms: "Rooms",
        doors: "Doors",
        nodes: "Nodes",
        edges: "Edges",
        building: "Building",
        howWorks: "How does this work?",
      };

  return (
    <div className="flex flex-col gap-5">
      <Section label={t.floor}>
        <div className="flex flex-col gap-1.5">
          {floors.map((f) => {
            const active = f.floorSlug === displayedFloorSlug;
            return (
              <button
                key={f.floorSlug}
                type="button"
                onClick={() => onSelectFloor(f.floorSlug)}
                className={
                  "flex items-center gap-3 rounded-md border px-3 py-2 text-left text-body transition-colors " +
                  (active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[color:var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-3)]")
                }
              >
                <span
                  className={
                    "grid h-7 w-9 place-items-center rounded-md font-mono text-[0.72rem] tabular-nums " +
                    (active
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--surface-3)] text-[color:var(--muted-foreground)]")
                  }
                >
                  L{f.level}
                </span>
                <span className="flex-1 font-medium">{f.name[lang]}</span>
                <span className="text-caption">
                  {f.rooms.length} {t.rooms.toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label={t.display}>
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 hover:bg-[var(--surface-3)]">
          <input
            type="checkbox"
            checked={showGraph}
            onChange={(e) => onShowGraphChange(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-body font-medium">{t.graphLabel}</span>
            <span className="text-caption">{t.graphHint}</span>
          </span>
        </label>
      </Section>

      <Section label={t.info}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-caption">
          <Stat term={t.building} value={prettyBuildingName(buildingSlug)} />
          <Stat term={t.floor} value={currentFloor.name[lang]} />
          <Stat term={t.rooms} value={currentFloor.rooms.length} />
          <Stat term={t.doors} value={currentFloor.doors.length} />
          <Stat term={t.nodes} value={currentFloor.nodes.length} />
          <Stat term={t.edges} value={currentFloor.edges.length} />
        </dl>
      </Section>

    </div>
  );
}

function Stat({ term, value }: { term: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-overline">{term}</dt>
      <dd className="text-body text-[color:var(--foreground)]">{value}</dd>
    </div>
  );
}

/* ─── Navigate · Settings view ────────────────────────────────────────────── */

type RoomOption = {
  value: string;
  floor: string;
  room: string;
  label: string;
  floorName: string;
};

function NavigateSettings({
  lang,
  fromRef,
  toRef,
  options,
  profileId,
  onFromChange,
  onToChange,
  onProfileChange,
  onSwap,
  onClear,
  onShowDirections,
  activePath,
  publicSlug,
  currentFloorSlug,
  onAssistantRoute,
}: {
  lang: Lang;
  fromRef: RoomRef;
  toRef: RoomRef;
  options: RoomOption[];
  profileId: string;
  onFromChange: (v: RoomRef) => void;
  onToChange: (v: RoomRef) => void;
  onProfileChange: (v: string) => void;
  onSwap: () => void;
  onClear: () => void;
  onShowDirections: () => void;
  activePath: MultiFloorPath | null;
  publicSlug: string;
  currentFloorSlug: string;
  onAssistantRoute: (p: MultiFloorPath, profileId: string | null) => void;
}) {
  const isEl = lang === "el";
  const t = isEl
    ? {
        profile: "Προφίλ",
        from: "Από",
        to: "Προς",
        swap: "Αντιστροφή",
        clear: "Καθαρισμός",
        getDirections: "Οδηγίες",
        pickRooms: "Επιλέξτε σημείο έναρξης και προορισμό.",
        noRoute: "Επιλέξτε δύο διαφορετικά δωμάτια.",
        noRouteForProfile: (p: string) => `Καμία διαδρομή για το προφίλ «${p.toLowerCase()}».`,
        or: "ή ρωτήστε τον βοηθό",
        placeholder: "— Επιλέξτε δωμάτιο —",
      }
    : {
        profile: "Profile",
        from: "From",
        to: "To",
        swap: "Swap",
        clear: "Clear",
        getDirections: "Get directions",
        pickRooms: "Pick a starting room and a destination.",
        noRoute: "Pick two different rooms.",
        noRouteForProfile: (p: string) => `No route for the ${p.toLowerCase()} profile.`,
        or: "or ask the assistant",
        placeholder: "— Select a room —",
      };

  const profile: Profile = PROFILES[profileId] ?? PROFILES.default;
  const isEmpty = !fromRef.room || !toRef.room;
  const sameRoom =
    !isEmpty &&
    fromRef.floor === toRef.floor &&
    fromRef.room === toRef.room;

  return (
    <div className="flex flex-col gap-5">
      <Section label={t.profile}>
        <div className="flex flex-col gap-1.5">
          {PROFILE_LIST.map((p) => {
            const active = p.id === profileId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProfileChange(p.id)}
                className={
                  "flex items-center justify-between rounded-md border px-3 py-2 text-left text-body transition-colors " +
                  (active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[color:var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-3)]")
                }
              >
                <span className="font-medium">{profileLabel(p, lang)}</span>
                {active && (
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--brand)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <Section label={`${t.from} / ${t.to}`}>
        <Field label={t.from}>
          <RoomSelect
            value={fromRef}
            options={options}
            onChange={onFromChange}
            placeholder={t.placeholder}
          />
        </Field>
        <Field label={t.to}>
          <RoomSelect
            value={toRef}
            options={options}
            onChange={onToChange}
            placeholder={t.placeholder}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSwap}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs font-medium text-[color:var(--foreground)] hover:bg-[var(--surface-3)]"
          >
            <span aria-hidden>↑↓</span> {t.swap}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs font-medium text-[color:var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[color:var(--foreground)]"
          >
            <Eraser className="h-3 w-3" /> {t.clear}
          </button>
        </div>

        {isEmpty ? (
          <p className="text-caption">{t.pickRooms}</p>
        ) : sameRoom ? (
          <p className="text-caption">{t.noRoute}</p>
        ) : !activePath ? (
          <p className="text-caption text-[color:color-mix(in_oklab,var(--warning),#000_15%)]">
            {t.noRouteForProfile(profileLabel(profile, lang))}
          </p>
        ) : (
          <button
            type="button"
            onClick={onShowDirections}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-card)] hover:bg-[var(--brand-strong)]"
          >
            {t.getDirections}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </Section>

      <div className="flex items-center gap-2 text-caption">
        <span aria-hidden className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-[color:var(--muted-foreground)]">{t.or}</span>
        <span aria-hidden className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <AssistantPanel
        publicSlug={publicSlug}
        floor={currentFloorSlug}
        onRoute={onAssistantRoute}
      />
    </div>
  );
}

/* ─── Navigate · Directions view ──────────────────────────────────────────── */
//
// The buildDirections() walker lives in src/lib/map/directions.ts; it
// emits Step objects with metres, turn classification, and floor-change
// direction. The view below just renders them.

function DirectionsPanel({
  lang,
  steps,
  selectedIdx,
  onSelectStep,
  path,
  floors,
  displayedFloorSlug,
  profile,
  aiAuthored,
  onBack,
}: {
  lang: Lang;
  steps: Step[];
  selectedIdx: number | null;
  onSelectStep: (idx: number) => void;
  path: MultiFloorPath;
  floors: FloorMapData[];
  displayedFloorSlug: string;
  profile: Profile;
  aiAuthored: boolean;
  onBack: () => void;
}) {
  const isEl = lang === "el";
  const t = isEl
    ? {
        back: "Πίσω στις ρυθμίσεις",
        directions: "Οδηγίες",
        assistant: "Από τον βοηθό",
        cost: "κόστος",
        segments: "τμήματα",
        otherFloor: "Σε άλλον όροφο",
        clickHint: "Πατήστε ένα βήμα για να εστιάσετε στον χάρτη.",
        prev: "Προηγ.",
        next: "Επόμ.",
        stepOf: (i: number, n: number) => `Βήμα ${i} από ${n}`,
        stepsCount: (n: number) => `${n} βήματα`,
      }
    : {
        back: "Back to settings",
        directions: "Directions",
        assistant: "From the assistant",
        cost: "cost",
        segments: "segments",
        otherFloor: "On another floor",
        clickHint: "Tap a step to focus it on the map.",
        prev: "Prev",
        next: "Next",
        stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
        stepsCount: (n: number) => `${n} steps`,
      };

  const totalSegments = path.segments.reduce(
    (n, s) => n + Math.max(0, s.nodes.length - 1),
    0,
  );

  // Keep refs to each step's <li> so Prev/Next can scroll the focused step
  // into view inside the sidebar's scroll container.
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  useEffect(() => {
    if (selectedIdx === null) return;
    stepRefs.current[selectedIdx]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedIdx]);

  const hasSelection = selectedIdx !== null;
  const canPrev = hasSelection && selectedIdx > 0;
  const canNext = hasSelection
    ? selectedIdx < steps.length - 1
    : steps.length > 0;
  const goPrev = () => {
    if (!canPrev) return;
    onSelectStep((selectedIdx as number) - 1);
  };
  const goNext = () => {
    if (!canNext) return;
    onSelectStep(hasSelection ? (selectedIdx as number) + 1 : 0);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 self-start rounded-md text-xs font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t.back}
      </button>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-h3">{t.directions}</h2>
          {aiAuthored && (
            <span className="text-caption text-[color:var(--brand)]">
              {t.assistant}
            </span>
          )}
        </div>
        <p className="text-caption">
          {profileLabel(profile, lang)} · {totalSegments} {t.segments} ·{" "}
          {t.cost} {path.cost.toFixed(1)}
        </p>
        <p className="text-[0.7rem] text-[color:var(--muted-foreground)]">
          {t.clickHint}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-1.5">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          aria-label={t.prev}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium text-[color:var(--foreground)] hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.prev}
        </button>
        <span className="text-caption tabular-nums">
          {hasSelection
            ? t.stepOf((selectedIdx as number) + 1, steps.length)
            : t.stepsCount(steps.length)}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          aria-label={t.next}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium text-[color:var(--foreground)] hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {t.next}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ol className="flex flex-col gap-1">
        {steps.map((step, i) => (
          <StepItem
            key={i}
            n={i + 1}
            step={step}
            floors={floors}
            lang={lang}
            isOnDisplayedFloor={step.floorSlug === displayedFloorSlug}
            isSelected={selectedIdx === i}
            isLast={i === steps.length - 1}
            otherFloorLabel={t.otherFloor}
            onClick={() => onSelectStep(i)}
            liRef={(el) => {
              stepRefs.current[i] = el;
            }}
          />
        ))}
      </ol>
    </div>
  );
}

function StepItem({
  n,
  step,
  floors,
  lang,
  isOnDisplayedFloor,
  isSelected,
  isLast,
  otherFloorLabel,
  onClick,
  liRef,
}: {
  n: number;
  step: Step;
  floors: FloorMapData[];
  lang: Lang;
  isOnDisplayedFloor: boolean;
  isSelected: boolean;
  isLast: boolean;
  otherFloorLabel: string;
  onClick: () => void;
  liRef?: (el: HTMLLIElement | null) => void;
}) {
  const floor = floors.find((f) => f.floorSlug === step.floorSlug);
  const Icon = stepIcon(step);
  const accent = stepAccent(step);
  return (
    <li ref={liRef} className="relative">
      {/* Vertical connector to the next item */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[27px] top-9 bottom-[-0.25rem] w-px bg-[var(--border)]"
        />
      )}
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        className={
          "flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors " +
          (isSelected
            ? "bg-[var(--brand-soft)]"
            : "hover:bg-[var(--surface-3)]")
        }
      >
        <span
          className={
            "z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 " +
            accent
          }
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="flex flex-1 flex-col gap-0.5 pt-1">
          <p
            className={
              "text-body " +
              (isSelected
                ? "font-medium text-[color:var(--foreground)]"
                : "text-[color:var(--foreground)]")
            }
          >
            <span className="text-caption mr-1.5">{n}.</span>
            {step.text}
          </p>
          {!isOnDisplayedFloor && floor && (
            <span className="inline-flex items-center gap-1 self-start rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[0.7rem] text-[color:var(--muted-foreground)]">
              <CornerRightDown className="h-3 w-3" />
              {otherFloorLabel} · {floor.name[lang]}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

function stepIcon(step: Step) {
  switch (step.kind) {
    case "start":
      return MapPin;
    case "continue":
      switch (step.turn) {
        case "left":
          return CornerUpLeft;
        case "right":
          return CornerUpRight;
        case "u-turn":
          return RefreshCw;
        case "straight":
        default:
          return MoveRight;
      }
    case "elevator":
    case "stairs":
      return step.direction === "up" ? ArrowUp : ArrowDown;
    case "arrive":
      return Flag;
  }
}

function stepAccent(step: Step): string {
  switch (step.kind) {
    case "start":
      return "border-[var(--brand)] bg-[var(--background)] text-[color:var(--brand)]";
    case "arrive":
      return "border-[var(--brand)] bg-[var(--brand)] text-white";
    case "elevator":
    case "stairs":
      return "border-[var(--feature)] bg-[var(--background)] text-[color:var(--feature)]";
    case "continue":
    default:
      return "border-[var(--border)] bg-[var(--background)] text-[color:var(--muted-foreground)]";
  }
}

/* ─── Shared layout primitives ────────────────────────────────────────────── */

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-overline">{label}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-overline">{label}</span>
      {children}
    </label>
  );
}

function RoomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: RoomRef;
  onChange: (v: RoomRef) => void;
  options: RoomOption[];
  placeholder?: string;
}) {
  const byFloor = useMemo(() => {
    const m = new Map<string, { floorName: string; opts: RoomOption[] }>();
    for (const o of options) {
      const e = m.get(o.floor);
      if (e) e.opts.push(o);
      else m.set(o.floor, { floorName: o.floorName, opts: [o] });
    }
    return Array.from(m.entries());
  }, [options]);

  // Empty room → render the placeholder option as selected. The select's
  // value matches the placeholder's value so the browser doesn't fall
  // back to "first option" rendering.
  const currentValue = value.room ? `${value.floor}|${value.room}` : "";

  return (
    <select
      value={currentValue}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) {
          onChange({ floor: "", room: "" });
          return;
        }
        const [floor, ...rest] = v.split("|");
        onChange({ floor, room: rest.join("|") });
      }}
      className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-body shadow-sm focus:border-[var(--brand)] focus:outline-none"
    >
      <option value="">{placeholder ?? "—"}</option>
      {byFloor.map(([floorSlug, { floorName, opts }]) => (
        <optgroup key={floorSlug} label={floorName}>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
