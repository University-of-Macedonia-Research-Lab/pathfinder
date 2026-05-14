import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh bg-[var(--surface-1)]">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" aria-label="Pathfinder dashboard">
            <Image
              src="/logo-light.svg"
              alt="Pathfinder"
              width={408}
              height={45}
              priority
              className="h-6 w-auto dark:invert"
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-caption">{user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">Sign out</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
