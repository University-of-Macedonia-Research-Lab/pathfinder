import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. No Prisma adapter, no DB access — that lives in
 * `src/auth.ts` and is only imported from server components and route
 * handlers. This file is what `middleware.ts` uses so the bundle can run
 * in the Edge runtime.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
};
