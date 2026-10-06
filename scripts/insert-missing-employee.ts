import mongoose from "mongoose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const MONGO_ID = "6ab4d28d0affe1b815a9e4d8";

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  const databaseUrl = process.env.DATABASE_URL;

  if (!mongoUri) throw new Error("MONGODB_URI is not configured");
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB database connection not available");

  const mongoEmployee = await db.collection("employees").findOne({
    _id: new mongoose.Types.ObjectId(MONGO_ID),
  });

  if (!mongoEmployee) {
    throw new Error(`MongoDB employee ${MONGO_ID} not found`);
  }

  console.log(
    `MongoDB employee found: ${mongoEmployee.applicationRef}`
  );

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.employee.findUnique({
      where: {
        id: MONGO_ID,
      },
    });

    if (existing) {
      console.log("STOP: Employee already exists in PostgreSQL.");
      console.log({
        id: existing.id,
        applicationRef: existing.applicationRef,
      });
      return;
    }

    const applicationRef = mongoEmployee.applicationRef;

    const existingApplication = await prisma.employee.findUnique({
      where: {
        applicationRef,
      },
    });

    if (existingApplication) {
      throw new Error(
        `STOP: applicationRef ${applicationRef} already exists in PostgreSQL with ID ${existingApplication.id}`
      );
    }

    const toDate = (value: unknown): Date | undefined => {
      if (!value) return undefined;
      const date = new Date(value as string | number | Date);
      return Number.isNaN(date.getTime()) ? undefined : date;
    };

    const toJson = (value: unknown): any => {
      if (value === undefined || value === null) return undefined;
      return JSON.parse(JSON.stringify(value));
    };

    const employeeData: any = {
      id: MONGO_ID,
      applicationRef: mongoEmployee.applicationRef,
      email: mongoEmployee.email ?? "",
      phone: mongoEmployee.phone ?? "",
      status: mongoEmployee.status ?? "DRAFT",
      currentStep: mongoEmployee.currentStep ?? 0,
      completedSteps: toJson(mongoEmployee.completedSteps ?? []),
      personalDetails: toJson(mongoEmployee.personalDetails ?? {}),

      employeeId: mongoEmployee.employeeId ?? undefined,
      temporaryEmployeeId:
        mongoEmployee.temporaryEmployeeId ?? undefined,

      address: toJson(mongoEmployee.address),
      education: toJson(mongoEmployee.education),
      references: toJson(mongoEmployee.references),
      familyDetails: toJson(mongoEmployee.familyDetails),
      nominee: toJson(mongoEmployee.nominee),
      exServiceman: toJson(mongoEmployee.exServiceman),
      gunman: toJson(mongoEmployee.gunman),
      additionalDetails: toJson(mongoEmployee.additionalDetails),
      declaration: toJson(mongoEmployee.declaration),

      correctionNotes: mongoEmployee.correctionNotes ?? undefined,
      correctionSteps: toJson(mongoEmployee.correctionSteps),
      rejectionReason: mongoEmployee.rejectionReason ?? undefined,

      submittedSnapshot: toJson(mongoEmployee.submittedSnapshot),
      pendingFieldChanges: toJson(mongoEmployee.pendingFieldChanges),

      submittedBy: mongoEmployee.submittedBy ?? undefined,
      submittedByName: mongoEmployee.submittedByName ?? undefined,
      submittedByEmail: mongoEmployee.submittedByEmail ?? undefined,

      submittedAt: toDate(mongoEmployee.submittedAt),

      assignedL1Id: mongoEmployee.assignedL1Id ?? undefined,
      l1Decision: toJson(mongoEmployee.l1Decision),
      l1ApprovedAt: toDate(mongoEmployee.l1ApprovedAt),

      assignedL2Id: mongoEmployee.assignedL2Id ?? undefined,
      l2Decision: toJson(mongoEmployee.l2Decision),
      approvedAt: toDate(mongoEmployee.approvedAt),

      idGeneratedAt: toDate(mongoEmployee.idGeneratedAt),

      scanningDecision: toJson(mongoEmployee.scanningDecision),
      scanningCompletedAt: toDate(mongoEmployee.scanningCompletedAt),

      forwardedToSupportAt: toDate(
        mongoEmployee.forwardedToSupportAt
      ),
      forwardedToAdminAt: toDate(
        mongoEmployee.forwardedToAdminAt
      ),

      lastSavedAt: toDate(mongoEmployee.lastSavedAt),

      documentsFolder: toJson(mongoEmployee.documentsFolder),

      createdAt:
        toDate(mongoEmployee.createdAt) ?? new Date(),

      updatedAt:
        toDate(mongoEmployee.updatedAt) ?? new Date(),
    };

    console.log("\nInserting employee into PostgreSQL...");
    console.log({
      id: employeeData.id,
      applicationRef: employeeData.applicationRef,
      status: employeeData.status,
      currentStep: employeeData.currentStep,
    });

    const inserted = await prisma.employee.create({
      data: employeeData,
    });

    console.log("\n==========================================");
    console.log("EMPLOYEE INSERTED SUCCESSFULLY");
    console.log("==========================================");
    console.log({
      id: inserted.id,
      applicationRef: inserted.applicationRef,
      status: inserted.status,
      currentStep: inserted.currentStep,
    });
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error("\nINSERT FAILED:");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
