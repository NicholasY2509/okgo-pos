import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Edge compatible providers go here. Credentials and DB go in auth.ts
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day (Refresh token lifespan)
    updateAge: 30 * 60, // 30 minutes (Access token rotation)
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  trustHost: true,
} satisfies NextAuthConfig;
