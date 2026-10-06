/**
 * Application-level PostgreSQL backup for IdCard + IdCardDownloadLog
 * (no pg_dump / sudo required).
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/backup-idcards-before-migrate.ts
 */

import fs from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: requiredEnv("DATABASE_URL") }),
  });
}

function timestampForFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

async function main() {
  console.log("==========================================");
  console.log(" IdCard / IdCardDownloadLog PG backup");
  console.log("==========================================");

  const prisma = createPrismaClient();
  const backupsDir = path.join(process.cwd(), "backups");
  const filename = `idcards-before-migrate-${timestampForFilename()}.json`;
  const filepath = path.join(backupsDir, filename);

  try {
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    await prisma.$connect();
    const [idCards, downloadLogs] = await Promise.all([
      prisma.idCard.findMany({ orderBy: { id: "asc" } }),
      prisma.idCardDownloadLog.findMany({ orderBy: { id: "asc" } }),
    ]);

    const payload = {
      meta: {
        createdAt: new Date().toISOString(),
        source: "postgresql",
        purpose: "before-idcard-migrate",
        idCardCount: idCards.length,
        downloadLogCount: downloadLogs.length,
      },
      idCards,
      downloadLogs,
    };

    fs.writeFileSync(filepath, JSON.stringify(payload), "utf8");
    console.log(`IdCards: ${idCards.length}`);
    console.log(`Download logs: ${downloadLogs.length}`);
    console.log(`Backup path: backups/${filename}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
