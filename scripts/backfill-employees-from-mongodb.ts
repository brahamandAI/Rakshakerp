/**
 * Safe historical Employee backfill: MongoDB → Neon PostgreSQL.
 *
 * Matches Mongo `_id` → PostgreSQL `id` and fills fields that may have been
 * missed by the original migration — without wiping newer Prisma runtime data.
 *
 * Usage:
 *   DRY_RUN=true  npx tsx --env-file=.env scripts/backfill-employees-from-mongodb.ts
 *   DRY_RUN=false npx tsx --env-file=.env scripts/backfill-employees-from-mongodb.ts
 *
 * Default is DRY_RUN=true (no writes) unless DRY_RUN is explicitly "false" / "0" / "no".
 *
 * Safety:
 * - Does not delete or modify MongoDB data
 * - Does not drop/truncate PostgreSQL tables
 * - Does not insert new employees (reports missing PG rows only)
 * - Does not overwrite PG fields when PG updatedAt is newer than Mongo
 * - Fills empty/null PG fields from Mongo when Mongo has a value
 */

import mongoose from "mongoose";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function isDryRun(): boolean {
  const raw = (process.env.DRY_RUN ?? "true").trim().toLowerCase();
  return !(raw === "false" || raw === "0" || raw === "no");
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: requiredEnv("DATABASE_URL"),
  });
  return new PrismaClient({ adapter });
}

function idOf(value: unknown): string {
  if (value == null) {
    throw new Error("Missing MongoDB _id");
  }
  return String(value);
}

function optionalIdOf(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return String(value);
}

function toDateOrNull(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toInt(value: unknown, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) {
    return fallback;
  }
  return number;
}

/** Deep-clone Mongo values into plain JSON. */
function cloneJson(value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }
  return JSON.parse(JSON.stringify(value));
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    Object.keys(value as object).length === 0
  ) {
    return true;
  }
  return false;
}

function normalizeForCompare(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return asDate.toISOString();
    }
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return (
    JSON.stringify(normalizeForCompare(a)) ===
    JSON.stringify(normalizeForCompare(b))
  );
}

type FieldKind = "string" | "int" | "date" | "json" | "id";

type FieldSpec = {
  key: string;
  kind: FieldKind;
  /** Required Postgres columns — never set to SQL NULL. */
  required?: boolean;
};

/**
 * Fields eligible for historical backfill.
 * `id` is matching key only — never updated.
 */
const BACKFILL_FIELDS: FieldSpec[] = [
  { key: "applicationRef", kind: "string", required: true },
  { key: "email", kind: "string", required: true },
  { key: "phone", kind: "string", required: true },
  { key: "status", kind: "string", required: true },
  { key: "currentStep", kind: "int", required: true },
  { key: "completedSteps", kind: "json", required: true },
  { key: "employeeId", kind: "string" },
  { key: "temporaryEmployeeId", kind: "string" },
  { key: "personalDetails", kind: "json", required: true },
  { key: "address", kind: "json" },
  { key: "education", kind: "json" },
  { key: "references", kind: "json" },
  { key: "familyDetails", kind: "json" },
  { key: "nominee", kind: "json" },
  { key: "exServiceman", kind: "json" },
  { key: "gunman", kind: "json" },
  { key: "additionalDetails", kind: "json" },
  { key: "declaration", kind: "json" },
  { key: "correctionNotes", kind: "string" },
  { key: "correctionSteps", kind: "json" },
  { key: "rejectionReason", kind: "string" },
  { key: "submittedSnapshot", kind: "json" },
  { key: "pendingFieldChanges", kind: "json" },
  { key: "submittedBy", kind: "id" },
  { key: "submittedByName", kind: "string" },
  { key: "submittedByEmail", kind: "string" },
  { key: "submittedAt", kind: "date" },
  { key: "assignedL1Id", kind: "id" },
  { key: "l1Decision", kind: "json" },
  { key: "l1ApprovedAt", kind: "date" },
  { key: "assignedL2Id", kind: "id" },
  { key: "l2Decision", kind: "json" },
  { key: "approvedAt", kind: "date" },
  { key: "idGeneratedAt", kind: "date" },
  { key: "scanningDecision", kind: "json" },
  { key: "scanningCompletedAt", kind: "date" },
  { key: "forwardedToSupportAt", kind: "date" },
  { key: "forwardedToAdminAt", kind: "date" },
  { key: "lastSavedAt", kind: "date" },
  { key: "documentsFolder", kind: "json" },
  { key: "createdAt", kind: "date", required: true },
  { key: "updatedAt", kind: "date", required: true },
];

type MongoEmployee = Record<string, unknown> & { _id: unknown };

function mongoFieldValue(
  doc: MongoEmployee,
  spec: FieldSpec
): unknown {
  const raw = doc[spec.key];

  switch (spec.kind) {
    case "id":
      return optionalIdOf(raw);
    case "date":
      return toDateOrNull(raw);
    case "int":
      return toInt(raw, spec.key === "currentStep" ? 1 : 0);
    case "string": {
      if (raw === undefined || raw === null) {
        return spec.required ? "" : null;
      }
      return String(raw);
    }
    case "json": {
      if (raw === undefined || raw === null) {
        if (spec.key === "completedSteps") return [];
        if (spec.key === "personalDetails") return {};
        return null;
      }
      return cloneJson(raw);
    }
    default:
      return raw;
  }
}

function pgFieldValue(
  row: Record<string, unknown>,
  spec: FieldSpec
): unknown {
  return row[spec.key];
}

/**
 * Decide whether to copy Mongo → PG for one field.
 *
 * Rules:
 * 1. Equal → skip
 * 2. PG empty and Mongo has value → update (fill migration gap)
 * 3. Both have values and differ:
 *    - if PG.updatedAt > Mongo.updatedAt → skip (runtime / newer PG wins)
 *    - otherwise → update from Mongo (historical backfill)
 * 4. Never clear a required PG field to empty via this path
 */
function shouldUpdateField(params: {
  spec: FieldSpec;
  mongoVal: unknown;
  pgVal: unknown;
  pgNewerThanMongo: boolean;
}): boolean {
  const { spec, mongoVal, pgVal, pgNewerThanMongo } = params;

  if (valuesEqual(mongoVal, pgVal)) {
    return false;
  }

  // Never invent empties over existing required PG data when Mongo is empty
  if (isEmptyValue(mongoVal) && !isEmptyValue(pgVal)) {
    return false;
  }

  if (isEmptyValue(pgVal) && !isEmptyValue(mongoVal)) {
    return true;
  }

  // Both populated and different
  if (pgNewerThanMongo) {
    return false;
  }

  // Protect unique identity-ish fields if PG already has a different non-empty value
  // and PG is not older — already handled by pgNewerThanMongo above.
  if (
    (spec.key === "applicationRef" ||
      spec.key === "employeeId" ||
      spec.key === "temporaryEmployeeId") &&
    !isEmptyValue(pgVal) &&
    !isEmptyValue(mongoVal) &&
    !valuesEqual(mongoVal, pgVal) &&
    pgNewerThanMongo
  ) {
    return false;
  }

  return !isEmptyValue(mongoVal);
}

function toPrismaUpdateValue(
  spec: FieldSpec,
  mongoVal: unknown
): Prisma.InputJsonValue | string | number | Date | null | typeof Prisma.DbNull {
  switch (spec.kind) {
    case "json": {
      if (mongoVal === null || mongoVal === undefined) {
        return spec.required
          ? (spec.key === "completedSteps" ? [] : {})
          : Prisma.DbNull;
      }
      return mongoVal as Prisma.InputJsonValue;
    }
    case "date":
      return mongoVal instanceof Date ? mongoVal : toDateOrNull(mongoVal);
    case "int":
      return typeof mongoVal === "number" ? mongoVal : toInt(mongoVal, 1);
    case "id":
    case "string":
      return (mongoVal as string | null) ?? (spec.required ? "" : null);
    default:
      return null;
  }
}

async function main() {
  const dryRun = isDryRun();
  const mongoUri = requiredEnv("MONGODB_URI");
  requiredEnv("DATABASE_URL"); // validate presence; never log the value

  const prisma = createPrismaClient();

  console.log("==========================================");
  console.log(" Employee historical backfill (Mongo → PG)");
  console.log("==========================================");
  console.log(`Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE WRITE"}`);
  console.log("Matching: Mongo _id → PostgreSQL id");
  console.log();

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  const mongoDb = mongoose.connection.db;
  if (!mongoDb) {
    throw new Error("MongoDB database connection is not available");
  }
  console.log("MongoDB connected");

  console.log("Connecting to PostgreSQL...");
  await prisma.$connect();
  console.log("PostgreSQL connected");
  console.log();

  const employeesCollection = mongoDb.collection("employees");

  const mongoEmployees = (await employeesCollection
    .find({})
    .toArray()) as MongoEmployee[];

  const pgEmployees = await prisma.employee.findMany();
  const pgById = new Map(pgEmployees.map((e) => [e.id, e]));

  const mongoCount = mongoEmployees.length;
  const pgCount = pgEmployees.length;

  let matched = 0;
  let missingInPg = 0;
  let alreadyMatching = 0;
  let requiringUpdate = 0;
  let updateSuccess = 0;
  let updateFailure = 0;

  const missingIds: string[] = [];
  const sampleChanges: Array<{
    id: string;
    applicationRef: string;
    fields: string[];
  }> = [];

  console.log("Comparing records...");
  console.log();

  for (const mongoDoc of mongoEmployees) {
    let id: string;
    try {
      id = idOf(mongoDoc._id);
    } catch {
      updateFailure += 1;
      console.error("  ! Skipping Mongo employee with invalid _id");
      continue;
    }

    const pg = pgById.get(id);
    if (!pg) {
      missingInPg += 1;
      missingIds.push(id);
      continue;
    }

    matched += 1;

    const mongoUpdatedAt = toDateOrNull(mongoDoc.updatedAt);
    const pgUpdatedAt = pg.updatedAt;
    const pgNewerThanMongo =
      Boolean(mongoUpdatedAt) &&
      Boolean(pgUpdatedAt) &&
      pgUpdatedAt.getTime() > mongoUpdatedAt!.getTime();

    const patch: Record<string, unknown> = {};
    const changedFields: string[] = [];

    for (const spec of BACKFILL_FIELDS) {
      // createdAt: only fill if somehow empty (should not happen); never overwrite
      if (spec.key === "createdAt") {
        continue;
      }
      // updatedAt: set to now only when we apply other field changes (below)
      if (spec.key === "updatedAt") {
        continue;
      }

      const mongoVal = mongoFieldValue(mongoDoc, spec);
      const pgVal = pgFieldValue(pg as unknown as Record<string, unknown>, spec);

      if (
        !shouldUpdateField({
          spec,
          mongoVal,
          pgVal,
          pgNewerThanMongo,
        })
      ) {
        continue;
      }

      patch[spec.key] = toPrismaUpdateValue(spec, mongoVal);
      changedFields.push(spec.key);
    }

    if (changedFields.length === 0) {
      alreadyMatching += 1;
      continue;
    }

    requiringUpdate += 1;

    if (sampleChanges.length < 15) {
      sampleChanges.push({
        id,
        applicationRef: String(
          (pg as { applicationRef?: string }).applicationRef ??
            mongoDoc.applicationRef ??
            ""
        ),
        fields: changedFields,
      });
    }

    if (dryRun) {
      continue;
    }

    try {
      await prisma.employee.update({
        where: { id },
        data: {
          ...(patch as Prisma.EmployeeUpdateInput),
          updatedAt: new Date(),
        },
      });
      updateSuccess += 1;
    } catch (error) {
      updateFailure += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `  ! Update failed for ${id} (${String(mongoDoc.applicationRef ?? "")}): ${message}`
      );
    }
  }

  // PG-only rows (no Mongo match) — informational
  const mongoIds = new Set(
    mongoEmployees.map((d) => {
      try {
        return idOf(d._id);
      } catch {
        return "";
      }
    })
  );
  const pgOnly = pgEmployees.filter((e) => !mongoIds.has(e.id)).length;

  console.log("==========================================");
  console.log(" Summary");
  console.log("==========================================");
  console.log(`MongoDB employee count:        ${mongoCount}`);
  console.log(`PostgreSQL employee count:     ${pgCount}`);
  console.log(`Matched (same id):             ${matched}`);
  console.log(`Missing in PostgreSQL:         ${missingInPg}`);
  console.log(`PostgreSQL-only (no Mongo):    ${pgOnly}`);
  console.log(`Records already matching:      ${alreadyMatching}`);
  console.log(`Records requiring update:      ${requiringUpdate}`);
  if (dryRun) {
    console.log(`Update success count:          n/a (dry run)`);
    console.log(`Update failure count:          n/a (dry run)`);
    console.log();
    console.log("DRY RUN — no PostgreSQL writes were performed.");
    console.log(
      'Re-run with DRY_RUN=false to apply updates: DRY_RUN=false npx tsx --env-file=.env scripts/backfill-employees-from-mongodb.ts'
    );
  } else {
    console.log(`Update success count:          ${updateSuccess}`);
    console.log(`Update failure count:          ${updateFailure}`);
  }
  console.log();

  if (sampleChanges.length > 0) {
    console.log("Sample records that would be / were updated (max 15):");
    for (const sample of sampleChanges) {
      console.log(
        `  - ${sample.applicationRef || sample.id}: ${sample.fields.join(", ")}`
      );
    }
    console.log();
  }

  if (missingIds.length > 0) {
    console.log(
      `Missing PostgreSQL ids (first ${Math.min(20, missingIds.length)} of ${missingIds.length}):`
    );
    for (const mid of missingIds.slice(0, 20)) {
      console.log(`  - ${mid}`);
    }
    console.log(
      "(These are not inserted by this script — insert requires a separate migration.)"
    );
    console.log();
  }

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error();
  console.error("Backfill failed:", error instanceof Error ? error.message : error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
