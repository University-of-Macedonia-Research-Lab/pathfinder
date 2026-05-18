import { requireUser } from "@/lib/auth-helpers";
import { DashboardChrome } from "./chrome";

// The dashboard is owner-facing and mutation-heavy. Render every segment
// under it fresh from the database so a building, floor, or publish change
// shows up on the next navigation instead of a stale cached render.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <DashboardChrome
      user={{
        name: user.name ?? null,
        email: user.email ?? null,
        image: user.image ?? null,
      }}
    >
      {children}
    </DashboardChrome>
  );
}
