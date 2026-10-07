import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRepairStarted?: boolean;
};

function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || process.env.DATABASE_URI?.trim() || undefined;
}

function createPrismaClient() {
  const connectionString = databaseUrl();

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** One-time PostgreSQL startup repair (Node server only; not via instrumentation). */
if (!globalForPrisma.prismaRepairStarted) {
  globalForPrisma.prismaRepairStarted = true;
  void import("./startup-repair")
    .then((mod) => mod.repairLegacyOnboardingSteps())
    .catch(() => undefined);
}
