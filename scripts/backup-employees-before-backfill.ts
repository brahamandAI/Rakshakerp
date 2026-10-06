/**
 * Application-level PostgreSQL Employee backup (no pg_dump / sudo required).
 *
 * Exports all Employee rows to:
 *   backups/employees-before-backfill-YYYYMMDD-HHmmss.json
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/backup-employees-before-backfill.ts
 *
 * Safety:
 * - Read-only against PostgreSQL
 * - Does not print employee field values or connection strings
 */

import fs from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: requiredEnv("DATABASE_URL"),
  });
  return new PrismaClient({ adapter });
}

function timestampForFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

export type EmployeeBackupFile = {
  meta: {
    createdAt: string;
    source: "postgresql";
    table: "employees";
    purpose: "before-employee-backfill";
    employeeCount: number;
  };
  employees: unknown[];
};

async function main() {
  console.log("==========================================");
  console.log(" Employee PostgreSQL backup");
  console.log("==========================================");

  requiredEnv("DATABASE_URL");

  const prisma = createPrismaClient();
  const backupsDir = path.join(process.cwd(), "backups");
  const filename = `employees-before-backfill-${timestampForFilename()}.json`;
  const filepath = path.join(backupsDir, filename);

  try {
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();

    const employees = await prisma.employee.findMany({
      orderBy: { id: "asc" },
    });

    const payload: EmployeeBackupFile = {
      meta: {
        createdAt: new Date().toISOString(),
        source: "postgresql",
        table: "employees",
        purpose: "before-employee-backfill",
        employeeCount: employees.length,
      },
      employees,
    };

    const json = JSON.stringify(payload, null, 2);

    // Atomic-ish write: write temp then rename
    const tempPath = `${filepath}.tmp`;
    fs.writeFileSync(tempPath, json, { encoding: "utf8", flag: "w" });
    fs.renameSync(tempPath, filepath);

    // Verify file is readable and non-empty
    const stat = fs.statSync(filepath);
    if (stat.size < 10) {
      throw new Error("Backup file is empty or too small");
    }

    const parsed = JSON.parse(
      fs.readFileSync(filepath, "utf8")
    ) as EmployeeBackupFile;
    if (!Array.isArray(parsed.employees)) {
      throw new Error("Backup file missing employees array");
    }
    if (parsed.employees.length !== employees.length) {
      throw new Error(
        `Backup count mismatch: wrote ${employees.length}, re-read ${parsed.employees.length}`
      );
    }

    console.log("Result: SUCCESS");
    console.log(`Backup filename: ${filename}`);
    console.log(`Backup path: backups/${filename}`);
    console.log(`Employee count: ${employees.length}`);
  } catch (error) {
    console.log("Result: FAILURE");
    console.error(
      "Backup failed:",
      error instanceof Error ? error.message : String(error)
    );
    // Clean up partial temp file if present
    try {
      const tempPath = `${filepath}.tmp`;
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // ignore cleanup errors
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main();
