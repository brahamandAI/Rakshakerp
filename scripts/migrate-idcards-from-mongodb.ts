/**
 * Sync IdCard + IdCardDownloadLog from MongoDB → PostgreSQL.
 *
 * Reads both historical collections:
 *   - employee_id_cards (Mongoose runtime collection)
 *   - idcards (legacy / seed collection used by earlier migrate)
 *   - idcarddownloadlogs
 *
 * Usage:
 *   DRY_RUN=true  npx tsx --env-file=.env scripts/migrate-idcards-from-mongodb.ts
 *   DRY_RUN=false npx tsx --env-file=.env scripts/migrate-idcards-from-mongodb.ts
 *
 * Safety:
 * - Preserves Mongo _id as Prisma id
 * - Idempotent (upsert by id)
 * - Does NOT delete Mongo or PostgreSQL rows
 * - Does NOT migrate Employee
 */

import mongoose from "mongoose";
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

function idOf(value: unknown): string {
  if (value == null) throw new Error("Expected id value");
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const rec = value as { $oid?: string; toHexString?: () => string; toString?: () => string };
    if (typeof rec.$oid === "string") return rec.$oid;
    if (typeof rec.toHexString === "function") return rec.toHexString();
    if (typeof rec.toString === "function") {
      const s = rec.toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  throw new Error(`Cannot coerce id: ${String(value)}`);
}

function optionalIdOf(value: unknown): string | null {
  if (value == null) return null;
  try {
    return idOf(value);
  } catch {
    return null;
  }
}

function toDate(value: unknown, field: string, id: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (value && typeof value === "object" && "$date" in (value as object)) {
    const d = new Date((value as { $date: string }).$date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  throw new Error(`Invalid date for ${field} on ${id}`);
}

function optionalDate(value: unknown): Date | null {
  if (value == null) return null;
  try {
    return toDate(value, "optional", "n/a");
  } catch {
    return null;
  }
}

function optionalString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value);
  return s.length ? s : null;
}

type MongoIdCard = Record<string, unknown>;
type MongoLog = Record<string, unknown>;

async function main() {
  const dryRun = process.env.DRY_RUN !== "false";
  console.log("==========================================");
  console.log(" IdCard / DownloadLog Mongo → PG sync");
  console.log(` Mode: ${dryRun ? "DRY_RUN (no writes)" : "LIVE"}`);
  console.log("==========================================");

  requiredEnv("MONGODB_URI");
  requiredEnv("DATABASE_URL");

  const prisma = createPrismaClient();
  await mongoose.connect(requiredEnv("MONGODB_URI"));
  const mongoDb = mongoose.connection.db!;

  try {
    await prisma.$connect();

    const [runtimeCards, legacyCards, mongoLogs, pgCards, pgLogs, employees, users] =
      await Promise.all([
        mongoDb.collection("employee_id_cards").find({}).toArray(),
        mongoDb.collection("idcards").find({}).toArray(),
        mongoDb.collection("idcarddownloadlogs").find({}).toArray(),
        prisma.idCard.findMany({ select: { id: true, employeeId: true } }),
        prisma.idCardDownloadLog.findMany({ select: { id: true } }),
        prisma.employee.findMany({ select: { id: true } }),
        prisma.user.findMany({ select: { id: true } }),
      ]);

    const employeeIds = new Set(employees.map((e) => e.id));
    const userIds = new Set(users.map((u) => u.id));
    const pgCardIds = new Set(pgCards.map((c) => c.id));
    const pgLogIds = new Set(pgLogs.map((l) => l.id));
    const pgEmployeeCard = new Map(pgCards.map((c) => [c.employeeId, c.id]));

    // Prefer runtime collection docs when both exist for same _id
    const cardById = new Map<string, MongoIdCard>();
    for (const doc of legacyCards as MongoIdCard[]) {
      cardById.set(idOf(doc._id), doc);
    }
    for (const doc of runtimeCards as MongoIdCard[]) {
      cardById.set(idOf(doc._id), doc);
    }
    const mongoCards = [...cardById.values()];

    console.log(`Mongo employee_id_cards: ${runtimeCards.length}`);
    console.log(`Mongo idcards:           ${legacyCards.length}`);
    console.log(`Mongo unique cards:      ${mongoCards.length}`);
    console.log(`Mongo download logs:     ${mongoLogs.length}`);
    console.log(`PG id cards:             ${pgCards.length}`);
    console.log(`PG download logs:        ${pgLogs.length}`);

    const cardWouldCreate: string[] = [];
    const cardWouldUpdate: string[] = [];
    const cardMissingEmployee: string[] = [];
    const cardDuplicateEmployee: string[] = [];
    const cardInvalidGeneratedBy: string[] = [];
    const logWouldCreate: string[] = [];
    const logWouldSkip: string[] = [];
    const logMissingEmployee: string[] = [];
    const logMissingUser: string[] = [];
    const logInvalidIdCard: string[] = [];

    const seenEmployee = new Map<string, string>();

    type CardRow = {
      id: string;
      employeeId: string;
      employeeIdCode: string;
      employeeName: string | null;
      photoUrl: string | null;
      designation: string | null;
      department: string | null;
      branch: string | null;
      bloodGroup: string | null;
      dateOfBirth: string | null;
      address: string | null;
      qrCodeUrl: string | null;
      issueDate: Date | null;
      expiryDate: Date | null;
      url: string;
      downloadUrl: string | null;
      format: string;
      status: string;
      cardStatus: string | null;
      generatedBy: string | null;
      completedAt: Date | null;
      completedBy: string | null;
      generatedAt: Date;
      createdAt: Date;
      updatedAt: Date;
    };

    const cardRows: CardRow[] = [];

    for (const doc of mongoCards) {
      const id = idOf(doc._id);
      const employeeId = idOf(doc.employeeId);

      if (!employeeIds.has(employeeId)) {
        cardMissingEmployee.push(id);
        continue;
      }

      if (seenEmployee.has(employeeId)) {
        cardDuplicateEmployee.push(
          `${id} conflicts with ${seenEmployee.get(employeeId)} for employee ${employeeId}`
        );
        // Keep the ACTIVE one if possible, else first-seen
        const existingId = seenEmployee.get(employeeId)!;
        const existing = cardRows.find((r) => r.id === existingId);
        if (existing && existing.status === "ACTIVE") continue;
        if (String(doc.status ?? "") !== "ACTIVE") continue;
        // replace prior with this ACTIVE
        const idx = cardRows.findIndex((r) => r.id === existingId);
        if (idx >= 0) cardRows.splice(idx, 1);
      }
      seenEmployee.set(employeeId, id);

      // Also conflict with PG unique employeeId if different card id already stored
      const pgExisting = pgEmployeeCard.get(employeeId);
      if (pgExisting && pgExisting !== id && !pgCardIds.has(id)) {
        cardDuplicateEmployee.push(
          `PG already has card ${pgExisting} for employee ${employeeId}; mongo ${id} would conflict`
        );
        continue;
      }

      const generatedByRaw = optionalIdOf(doc.generatedBy);
      const generatedBy =
        generatedByRaw && userIds.has(generatedByRaw) ? generatedByRaw : null;
      if (generatedByRaw && !generatedBy) {
        cardInvalidGeneratedBy.push(`${id}:${generatedByRaw}`);
      }

      const completedByRaw = optionalIdOf(doc.completedBy);
      const completedBy =
        completedByRaw && userIds.has(completedByRaw) ? completedByRaw : null;

      const now = new Date();
      const generatedAt = optionalDate(doc.generatedAt) ?? now;
      const createdAt = optionalDate(doc.createdAt) ?? generatedAt;
      const updatedAt = optionalDate(doc.updatedAt) ?? createdAt;

      cardRows.push({
        id,
        employeeId,
        employeeIdCode: String(doc.employeeIdCode ?? ""),
        employeeName: optionalString(doc.employeeName),
        photoUrl: optionalString(doc.photoUrl),
        designation: optionalString(doc.designation),
        department: optionalString(doc.department),
        branch: optionalString(doc.branch),
        bloodGroup: optionalString(doc.bloodGroup),
        dateOfBirth: optionalString(doc.dateOfBirth),
        address: optionalString(doc.address),
        qrCodeUrl: optionalString(doc.qrCodeUrl),
        issueDate: optionalDate(doc.issueDate),
        expiryDate: optionalDate(doc.expiryDate),
        url: String(doc.url ?? ""),
        downloadUrl: optionalString(doc.downloadUrl),
        format: String(doc.format ?? "PDF"),
        status: String(doc.status ?? "ACTIVE"),
        cardStatus: optionalString(doc.cardStatus),
        generatedBy,
        completedAt: optionalDate(doc.completedAt),
        completedBy,
        generatedAt,
        createdAt,
        updatedAt,
      });

      if (pgCardIds.has(id)) cardWouldUpdate.push(id);
      else cardWouldCreate.push(id);
    }

    type LogRow = {
      id: string;
      idCardId: string | null;
      employeeId: string;
      employeeIdCode: string;
      employeeName: string;
      action: string;
      performedBy: string;
      performedByRole: string;
      createdAt: Date;
    };

    const logRows: LogRow[] = [];
    const knownCardIds = new Set([
      ...pgCardIds,
      ...cardRows.map((r) => r.id),
    ]);

    for (const doc of mongoLogs as MongoLog[]) {
      const id = idOf(doc._id);
      if (pgLogIds.has(id)) {
        logWouldSkip.push(id);
        continue;
      }

      const employeeId = idOf(doc.employeeId);
      const performedBy = idOf(doc.performedBy);
      if (!employeeIds.has(employeeId)) {
        logMissingEmployee.push(id);
        continue;
      }
      if (!userIds.has(performedBy)) {
        logMissingUser.push(id);
        continue;
      }

      const idCardIdRaw = optionalIdOf(doc.idCardId);
      let idCardId: string | null = idCardIdRaw;
      if (idCardIdRaw && !knownCardIds.has(idCardIdRaw)) {
        logInvalidIdCard.push(`${id}:${idCardIdRaw}`);
        idCardId = null;
      }

      logRows.push({
        id,
        idCardId,
        employeeId,
        employeeIdCode: String(doc.employeeIdCode ?? ""),
        employeeName: String(doc.employeeName ?? ""),
        action: String(doc.action ?? ""),
        performedBy,
        performedByRole: String(doc.performedByRole ?? ""),
        createdAt: optionalDate(doc.createdAt) ?? new Date(),
      });
      logWouldCreate.push(id);
    }

    console.log("\n--- Plan ---");
    console.log(`Cards create: ${cardWouldCreate.length}`);
    console.log(`Cards update: ${cardWouldUpdate.length}`);
    console.log(`Logs create:  ${logWouldCreate.length}`);
    console.log(`Logs already in PG (skip): ${logWouldSkip.length}`);
    console.log(`Cards missing employee: ${cardMissingEmployee.length}`);
    console.log(`Cards duplicate employeeId: ${cardDuplicateEmployee.length}`);
    console.log(`Cards invalid generatedBy (nulled): ${cardInvalidGeneratedBy.length}`);
    console.log(`Logs missing employee: ${logMissingEmployee.length}`);
    console.log(`Logs missing user: ${logMissingUser.length}`);
    console.log(`Logs invalid idCardId (nulled): ${logInvalidIdCard.length}`);

    if (cardDuplicateEmployee.length) {
      console.log("Duplicate employee warnings:");
      for (const w of cardDuplicateEmployee.slice(0, 20)) console.log(`  - ${w}`);
    }

    if (dryRun) {
      console.log("\nDRY_RUN complete — no writes performed.");
      return;
    }

    console.log("\nWriting cards...");
    for (const row of cardRows) {
      await prisma.idCard.upsert({
        where: { id: row.id },
        create: row,
        update: {
          employeeId: row.employeeId,
          employeeIdCode: row.employeeIdCode,
          employeeName: row.employeeName,
          photoUrl: row.photoUrl,
          designation: row.designation,
          department: row.department,
          branch: row.branch,
          bloodGroup: row.bloodGroup,
          dateOfBirth: row.dateOfBirth,
          address: row.address,
          qrCodeUrl: row.qrCodeUrl,
          issueDate: row.issueDate,
          expiryDate: row.expiryDate,
          url: row.url,
          downloadUrl: row.downloadUrl,
          format: row.format,
          status: row.status,
          cardStatus: row.cardStatus,
          generatedBy: row.generatedBy,
          completedAt: row.completedAt,
          completedBy: row.completedBy,
          generatedAt: row.generatedAt,
          updatedAt: row.updatedAt,
        },
      });
    }

    console.log("Writing download logs...");
    if (logRows.length > 0) {
      await prisma.idCardDownloadLog.createMany({
        data: logRows,
        skipDuplicates: true,
      });
    }

    const [finalCards, finalLogs] = await Promise.all([
      prisma.idCard.count(),
      prisma.idCardDownloadLog.count(),
    ]);
    console.log("\n--- Final PG counts ---");
    console.log(`IdCards: ${finalCards}`);
    console.log(`Download logs: ${finalLogs}`);
    console.log("LIVE sync complete.");
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
