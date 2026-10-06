/**
 * Verify an Employee JSON backup against current PostgreSQL data.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/verify-employee-backup.ts
 *   npx tsx --env-file=.env scripts/verify-employee-backup.ts backups/employees-before-backfill-YYYYMMDD-HHmmss.json
 *
 * If no path is given, uses the newest matching backup under backups/.
 *
 * Safety:
 * - Read-only against PostgreSQL
 * - Does not print employee field values or connection strings
 */

import fs from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { EmployeeBackupFile } from "./backup-employees-before-backfill";

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

function resolveBackupPath(arg?: string): string {
  if (arg) {
    const resolved = path.isAbsolute(arg)
      ? arg
      : path.join(process.cwd(), arg);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Backup file not found: ${arg}`);
    }
    return resolved;
  }

  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    throw new Error("backups/ directory does not exist");
  }

  const files = fs
    .readdirSync(backupsDir)
    .filter(
      (f) =>
        f.startsWith("employees-before-backfill-") && f.endsWith(".json")
    )
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    throw new Error(
      "No employees-before-backfill-*.json files found in backups/"
    );
  }

  return path.join(backupsDir, files[0].name);
}

function extractId(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const id = (row as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

async function main() {
  console.log("==========================================");
  console.log(" Employee backup verification");
  console.log("==========================================");

  requiredEnv("DATABASE_URL");

  const prisma = createPrismaClient();
  let passed = false;

  try {
    const backupPath = resolveBackupPath(process.argv[2]);
    const backupName = path.basename(backupPath);

    const raw = fs.readFileSync(backupPath, "utf8");
    const backup = JSON.parse(raw) as EmployeeBackupFile;

    if (!backup || !Array.isArray(backup.employees)) {
      throw new Error("Invalid backup format: expected { employees: [] }");
    }

    const backupEmployees = backup.employees;
    const backupCount = backupEmployees.length;
    const metaCount = backup.meta?.employeeCount;

    const ids: string[] = [];
    let invalidIdRows = 0;
    for (const row of backupEmployees) {
      const id = extractId(row);
      if (!id) {
        invalidIdRows += 1;
        continue;
      }
      ids.push(id);
    }

    const uniqueIds = new Set(ids);
    const duplicateIdsCount = ids.length - uniqueIds.size;

    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();

    const pgEmployees = await prisma.employee.findMany({
      select: { id: true },
    });
    const pgCount = pgEmployees.length;
    const pgIdSet = new Set(pgEmployees.map((e) => e.id));

    let missingIdsCount = 0;
    for (const id of uniqueIds) {
      if (!pgIdSet.has(id)) {
        missingIdsCount += 1;
      }
    }

    const metaMismatch =
      typeof metaCount === "number" && metaCount !== backupCount;

    passed =
      invalidIdRows === 0 &&
      duplicateIdsCount === 0 &&
      missingIdsCount === 0 &&
      !metaMismatch &&
      backupCount === pgCount;

    console.log(`Backup filename: ${backupName}`);
    console.log(`Backup employee count: ${backupCount}`);
    console.log(`PostgreSQL employee count: ${pgCount}`);
    console.log(`Missing IDs count: ${missingIdsCount}`);
    console.log(`Duplicate IDs count: ${duplicateIdsCount}`);
    if (invalidIdRows > 0) {
      console.log(`Invalid/missing id rows in backup: ${invalidIdRows}`);
    }
    if (metaMismatch) {
      console.log(
        `Meta count mismatch: meta.employeeCount=${metaCount}, array length=${backupCount}`
      );
    }
    console.log(
      `Verification: ${passed ? "PASSED" : "FAILED"}`
    );

    if (!passed) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.log("Verification: FAILED");
    console.error(
      "Verify failed:",
      error instanceof Error ? error.message : String(error)
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main();
