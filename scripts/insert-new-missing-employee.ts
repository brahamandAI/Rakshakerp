import mongoose from "mongoose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const MONGO_ID = "6ab4da1f0affe1b815a9f220";

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  const databaseUrl = process.env.DATABASE_URL;

  if (!mongoUri) throw new Error("MONGODB_URI is not configured");
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database connection not available");
  }

  const employee = await db.collection("employees").findOne({
    _id: new mongoose.Types.ObjectId(MONGO_ID),
  });

  if (!employee) {
    throw new Error(`MongoDB employee ${MONGO_ID} not found`);
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.employee.findUnique({
      where: { id: MONGO_ID },
    });

    if (existing) {
      console.log("Employee already exists in PostgreSQL.");
      return;
    }

    const existingApplication = await prisma.employee.findUnique({
      where: {
        applicationRef: employee.applicationRef,
      },
    });

    if (existingApplication) {
      throw new Error(
        `applicationRef ${employee.applicationRef} already exists in PostgreSQL`
      );
    }

    const json = (value: unknown) =>
      value === undefined || value === null
        ? undefined
        : JSON.parse(JSON.stringify(value));

    const date = (value: unknown) => {
      if (!value) return undefined;

      const d = new Date(value as string | number | Date);

      return Number.isNaN(d.getTime()) ? undefined : d;
    };

    const data: any = {
      id: MONGO_ID,
      applicationRef: employee.applicationRef,
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      status: employee.status ?? "DRAFT",
      currentStep: employee.currentStep ?? 0,
      completedSteps: json(employee.completedSteps ?? []),
      personalDetails: json(employee.personalDetails ?? {}),

      employeeId: employee.employeeId ?? undefined,
      temporaryEmployeeId:
        employee.temporaryEmployeeId ?? undefined,

      address: json(employee.address),
      education: json(employee.education),
      references: json(employee.references),
      familyDetails: json(employee.familyDetails),
      nominee: json(employee.nominee),
      exServiceman: json(employee.exServiceman),
      gunman: json(employee.gunman),
      additionalDetails: json(employee.additionalDetails),
      declaration: json(employee.declaration),

      correctionNotes: employee.correctionNotes ?? undefined,
      correctionSteps: json(employee.correctionSteps),
      rejectionReason: employee.rejectionReason ?? undefined,

      submittedSnapshot: json(employee.submittedSnapshot),
      pendingFieldChanges: json(employee.pendingFieldChanges),

      submittedBy: employee.submittedBy ?? undefined,
      submittedByName: employee.submittedByName ?? undefined,
      submittedByEmail: employee.submittedByEmail ?? undefined,

      submittedAt: date(employee.submittedAt),

      assignedL1Id: employee.assignedL1Id ?? undefined,
      l1Decision: json(employee.l1Decision),
      l1ApprovedAt: date(employee.l1ApprovedAt),

      assignedL2Id: employee.assignedL2Id ?? undefined,
      l2Decision: json(employee.l2Decision),
      approvedAt: date(employee.approvedAt),

      idGeneratedAt: date(employee.idGeneratedAt),

      scanningDecision: json(employee.scanningDecision),
      scanningCompletedAt: date(employee.scanningCompletedAt),

      forwardedToSupportAt: date(employee.forwardedToSupportAt),
      forwardedToAdminAt: date(employee.forwardedToAdminAt),

      lastSavedAt: date(employee.lastSavedAt),

      documentsFolder: json(employee.documentsFolder),

      createdAt: date(employee.createdAt) ?? new Date(),
      updatedAt: date(employee.updatedAt) ?? new Date(),
    };

    console.log("Inserting:");
    console.log({
      id: data.id,
      applicationRef: data.applicationRef,
      status: data.status,
      currentStep: data.currentStep,
    });

    const inserted = await prisma.employee.create({
      data,
    });

    console.log("\nEMPLOYEE INSERTED SUCCESSFULLY");
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
  console.error("INSERT FAILED:");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
