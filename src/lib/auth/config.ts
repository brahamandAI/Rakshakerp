import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { isStaffRole } from "@/lib/auth/permissions";
import {
  MAX_LOGIN_ATTEMPTS,
  ACCOUNT_LOCK_MINUTES,
} from "@/types/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) {
          return null;
        }

        if (!isStaffRole(user.role)) {
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account is temporarily locked. Try again later.");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          const failedLoginAttempts = user.failedLoginAttempts + 1;
          const lockAccount = failedLoginAttempts >= MAX_LOGIN_ATTEMPTS;

          await prisma.user.update({
            where: { id: user.id },
            data: lockAccount
              ? {
                  failedLoginAttempts: 0,
                  lockedUntil: new Date(
                    Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000
                  ),
                }
              : {
                  failedLoginAttempts,
                },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
