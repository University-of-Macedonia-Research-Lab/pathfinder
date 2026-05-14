import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: uses only the auth.config (no Prisma). Full session validation
// happens in server pages via `auth()` from src/auth.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*"],
};
