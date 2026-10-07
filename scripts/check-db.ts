/**
 * Verify the PostgreSQL connection from .env.
 * Run: npm run db:check
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

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
    const users = await prisma.user.count();
    console.log("Connected to PostgreSQL");
    console.log(`Staff users: ${users}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Connection failed";
  console.error("Connection failed");
  console.error(message);
  process.exit(1);
});
