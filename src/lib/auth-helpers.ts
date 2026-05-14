import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export async function getUser() {
  const session = await auth();
  return (session?.user as { id: string; name?: string | null; email?: string | null; image?: string | null } | undefined) ?? null;
}
