import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Pathfinder home">
          <Image
            src="/logo-light.svg"
            alt="Pathfinder"
            width={408}
            height={45}
            priority
            className="h-7 w-auto dark:invert"
          />
        </Link>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link href="/dashboard"><Button size="sm">Dashboard</Button></Link>
          ) : (
            <Link href="/signin"><Button size="sm">Sign in</Button></Link>
          )}
        </div>
      </header>

      <section className="flex flex-col items-start gap-6">
        <h1 className="text-h1 max-w-2xl">
          Build accessible indoor navigation for your buildings.
        </h1>
        <p className="text-lead max-w-2xl">
          Pathfinder lets you draw buildings, lay out floors and routing graphs,
          and publish them as public wayfinding maps with multi-profile routing
          (default, wheelchair, visually impaired).
        </p>
        <div className="flex gap-3">
          <Link href={session?.user ? "/dashboard" : "/signin"}>
            <Button size="lg">{session?.user ? "Open dashboard" : "Get started"}</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Feature title="Vector floor plans" body="Rooms, walls, doors as data — no PDFs, no georeferencing." />
        <Feature title="Accessibility-aware routing" body="Per-profile edge weights: stairs, ramps, narrow passages, elevators." />
        <Feature title="Publish in one click" body="Each building gets a public viewer URL anyone can use." />
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-h3 mb-2">{title}</h3>
      <p className="text-caption">{body}</p>
    </div>
  );
}
