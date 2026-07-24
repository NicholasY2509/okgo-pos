import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

import Credentials from "next-auth/providers/credentials";
import { AuthService } from "./services/auth-service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        subdomain: { label: "Subdomain", type: "text" },
      },
      async authorize(credentials) {
        return AuthService.verifyCredentials(
          credentials?.email as string | undefined,
          credentials?.password as string | undefined,
          credentials?.subdomain as string | undefined
        );
      },
    }),
  ],
});
