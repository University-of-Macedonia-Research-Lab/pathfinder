import { requireUser } from "@/lib/auth-helpers";
import { DashboardChrome } from "./chrome";

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
