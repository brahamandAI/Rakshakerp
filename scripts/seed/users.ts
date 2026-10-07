/**
 * Seed default staff users in PostgreSQL.
 * Run: npm run seed
 */
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/auth/password";

const SEED_USERS = [
  {
    email: "submitter@rakshaksecuritas.com",
    name: "Registration Submitter",
    role: "SUBMITTER",
    password: "Submit@123",
  },
  {
    email: "l1@rakshaksecuritas.com",
    name: "L1 Reviewer",
    role: "L1",
    password: "L1Pass@123",
  },
  {
    email: "l2@rakshaksecuritas.com",
    name: "L2 Approver",
    role: "L2",
    password: "L2Pass@123",
  },
  {
    email: "support@rakshaksecuritas.com",
    name: "Support Admin",
    role: "SUPPORT",
    password: "Support@123",
  },
  {
    email: "comadmin@rakshaksecuritas.com",
    name: "System Administrator",
    role: "ADMIN",
    password: "Admin@123",
  },
];

async function main() {
  const connectionString =
    process.env.DATABASE_URL?.trim() || process.env.DATABASE_URI?.trim();

  if (!connectionString) {
    console.error("DATABASE_URL is not set. Add it to .env");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    for (const user of SEED_USERS) {
      const email = user.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        console.log(`Skip: ${email} already exists`);
        continue;
      }

      const now = new Date();
      await prisma.user.create({
        data: {
          id: crypto.randomBytes(12).toString("hex"),
          email,
          name: user.name,
          role: user.role,
          passwordHash: await hashPassword(user.password),
          isActive: true,
          failedLoginAttempts: 0,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`Created: ${email} (${user.role})`);
    }

    console.log("Seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Seed failed";
  console.error(message);
  process.exit(1);
});
