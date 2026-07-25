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
    },
    redirect({ url, baseUrl }) {
      // If relative URL, preserve it so it resolves on the current subdomain
      if (url.startsWith("/")) return url;
      // If absolute, allow if it matches our domains
      try {
        const redirectUrl = new URL(url);
        if (redirectUrl.hostname.endsWith('nyenyak.com') || redirectUrl.hostname.includes('localhost')) {
          return url;
        }
      } catch (e) { }
      return baseUrl;
    }
  },
  trustHost: true,
} satisfies NextAuthConfig;
