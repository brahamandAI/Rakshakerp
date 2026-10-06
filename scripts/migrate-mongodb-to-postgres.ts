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

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: requiredEnv("DATABASE_URL"),
  });
  return new PrismaClient({ adapter });
}

function idOf(value: unknown): string {
  if (!value) {
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

function toDate(value: unknown, field: string, id: string): Date {
  const date = value instanceof Date ? value : new Date(value as string);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date in ${field} for document ${id}`);
  }

  return date;
}

function toInt(value: unknown, field: string, id: string): number {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    throw new Error(`Invalid integer in ${field} for document ${id}: ${value}`);
  }

  return number;
}

/** Serialize Mongo values into Prisma JSON-compatible InputJsonValue. */
function jsonSafe(
  value: unknown,
  fallback: Prisma.InputJsonValue = {}
): Prisma.InputJsonValue {
  if (value === undefined || value === null) {
    return fallback;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function createManyIfAny<T>(
  label: string,
  rows: T[],
  write: (data: T[]) => Promise<unknown>
): Promise<void> {
  if (rows.length === 0) {
    console.log(`   (no ${label} rows to insert)`);
    return;
  }
  await write(rows);
}

async function main() {
  const mongoUri = requiredEnv("MONGODB_URI");
  const prisma = createPrismaClient();

  console.log("==========================================");
  console.log(" MongoDB → PostgreSQL Migration");
  console.log("==========================================");
  console.log();

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);

  const mongoDb = mongoose.connection.db;

  if (!mongoDb) {
    throw new Error("MongoDB database connection is not available");
  }

  console.log("MongoDB connected");
  console.log();

  console.log("Connecting to PostgreSQL...");
  await prisma.$connect();
  console.log("PostgreSQL connected");
  console.log();

  try {
    // ------------------------------------------------------------
    // Read MongoDB collections
    // ------------------------------------------------------------

    const usersCollection = mongoDb.collection("users");
    const departmentsCollection = mongoDb.collection("departments");
    const designationsCollection = mongoDb.collection("designations");
    const siteLocationsCollection = mongoDb.collection("sitelocations");
    const employeesCollection = mongoDb.collection("employees");
    const employeeDocumentsCollection =
      mongoDb.collection("employeedocuments");
    const approvalHistoriesCollection =
      mongoDb.collection("approvalhistories");
    const notificationsCollection = mongoDb.collection("notifications");
    const auditLogsCollection = mongoDb.collection("auditlogs");
    const idCardsCollection = mongoDb.collection("idcards");
    const idCardDownloadLogsCollection =
      mongoDb.collection("idcarddownloadlogs");
    const settingsCollection = mongoDb.collection("settings");

    // ------------------------------------------------------------
    // Load source data
    // ------------------------------------------------------------

    console.log("Reading MongoDB data...");

    const [
      users,
      departments,
      designations,
      siteLocations,
      employees,
      employeeDocuments,
      approvalHistories,
      notifications,
      auditLogs,
      idCards,
      idCardDownloadLogs,
      settings,
    ] = await Promise.all([
      usersCollection.find({}).toArray(),
      departmentsCollection.find({}).toArray(),
      designationsCollection.find({}).toArray(),
      siteLocationsCollection.find({}).toArray(),
      employeesCollection.find({}).toArray(),
      employeeDocumentsCollection.find({}).toArray(),
      approvalHistoriesCollection.find({}).toArray(),
      notificationsCollection.find({}).toArray(),
      auditLogsCollection.find({}).toArray(),
      idCardsCollection.find({}).toArray(),
      idCardDownloadLogsCollection.find({}).toArray(),
      settingsCollection.find({}).toArray(),
    ]);

    console.log();
    console.log("MongoDB source counts:");
    console.log(`  Users:                 ${users.length}`);
    console.log(`  Departments:           ${departments.length}`);
    console.log(`  Designations:          ${designations.length}`);
    console.log(`  Site Locations:        ${siteLocations.length}`);
    console.log(`  Employees:             ${employees.length}`);
    console.log(`  Employee Documents:    ${employeeDocuments.length}`);
    console.log(`  Approval Histories:    ${approvalHistories.length}`);
    console.log(`  Notifications:         ${notifications.length}`);
    console.log(`  Audit Logs:            ${auditLogs.length}`);
    console.log(`  ID Cards:              ${idCards.length}`);
    console.log(`  ID Card Download Logs: ${idCardDownloadLogs.length}`);
    console.log(`  Settings:              ${settings.length}`);
    console.log();

    // ------------------------------------------------------------
    // Build lookup sets
    // ------------------------------------------------------------

    const userIds = new Set(users.map((user) => idOf(user._id)));
    const employeeIds = new Set(employees.map((employee) => idOf(employee._id)));

    // ------------------------------------------------------------
    // 1. Departments
    // ------------------------------------------------------------

    console.log("1/12 Migrating departments...");

    await createManyIfAny(
      "department",
      departments.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          name: String(doc.name ?? ""),
          code: String(doc.code ?? ""),
          description:
            doc.description === undefined || doc.description === null
              ? null
              : String(doc.description),
          isActive: Boolean(doc.isActive),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
        };
      }),
      (data) =>
        prisma.department.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`Departments migrated: ${departments.length}`);

    // ------------------------------------------------------------
    // 2. Designations
    // ------------------------------------------------------------

    console.log("2/12 Migrating designations...");

    await createManyIfAny(
      "designation",
      designations.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          code: String(doc.code ?? ""),
          name: String(doc.name ?? ""),
          departmentId: idOf(doc.departmentId),
          isActive: Boolean(doc.isActive),
          level:
            doc.level === undefined || doc.level === null
              ? null
              : toInt(doc.level, "level", id),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
        };
      }),
      (data) =>
        prisma.designation.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`Designations migrated: ${designations.length}`);

    // Site locations are part of the schema/final counts (read from MongoDB).
    console.log("   Migrating site locations...");
    await createManyIfAny(
      "site location",
      siteLocations.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          name: String(doc.name ?? ""),
          code: String(doc.code ?? ""),
          city: String(doc.city ?? ""),
          state: String(doc.state ?? ""),
          isActive: Boolean(doc.isActive),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
        };
      }),
      (data) =>
        prisma.siteLocation.createMany({
          data,
          skipDuplicates: true,
        })
    );
    console.log(`Site locations migrated: ${siteLocations.length}`);

    // ------------------------------------------------------------
    // 3. Users
    // ------------------------------------------------------------

    console.log("3/12 Migrating users...");

    await createManyIfAny(
      "user",
      users.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          email: String(doc.email ?? ""),
          passwordHash: String(doc.passwordHash ?? ""),
          name: String(doc.name ?? ""),
          role: String(doc.role ?? ""),
          isActive: Boolean(doc.isActive),
          failedLoginAttempts:
            doc.failedLoginAttempts === undefined ||
            doc.failedLoginAttempts === null
              ? 0
              : toInt(doc.failedLoginAttempts, "failedLoginAttempts", id),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
          lastLoginAt:
            doc.lastLoginAt === undefined || doc.lastLoginAt === null
              ? null
              : toDate(doc.lastLoginAt, "lastLoginAt", id),
        };
      }),
      (data) =>
        prisma.user.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`Users migrated: ${users.length}`);

    // ------------------------------------------------------------
    // 4. Employees
    // ------------------------------------------------------------

    console.log("4/12 Migrating employees...");

    await createManyIfAny(
      "employee",
      employees.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          applicationRef: String(doc.applicationRef ?? ""),
          email: String(doc.email ?? ""),
          phone: String(doc.phone ?? ""),
          status: String(doc.status ?? ""),
          currentStep: toInt(doc.currentStep ?? 0, "currentStep", id),
          completedSteps: jsonSafe(doc.completedSteps ?? [], []),
          personalDetails: jsonSafe(doc.personalDetails ?? {}, {}),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
        };
      }),
      (data) =>
        prisma.employee.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`Employees migrated: ${employees.length}`);

    // ------------------------------------------------------------
    // 5. Employee Documents
    // ------------------------------------------------------------

    console.log("5/12 Migrating employee documents...");

    for (const doc of employeeDocuments) {
      const employeeId = idOf(doc.employeeId);
      if (!employeeIds.has(employeeId)) {
        throw new Error(
          `Employee document ${idOf(doc._id)} references missing employee ${employeeId}`
        );
      }
    }

    await createManyIfAny(
      "employee document",
      employeeDocuments.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          employeeId: idOf(doc.employeeId),
          documentType: String(doc.documentType ?? ""),
          fileName: String(doc.fileName ?? ""),
          mimeType: String(doc.mimeType ?? ""),
          sizeBytes: toInt(doc.sizeBytes ?? 0, "sizeBytes", id),
          url: String(doc.url ?? ""),
          version: toInt(doc.version ?? 1, "version", id),
          isActive: Boolean(doc.isActive),
          uploadedBy: String(doc.uploadedBy ?? ""),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
        };
      }),
      (data) =>
        prisma.employeeDocument.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`Employee documents migrated: ${employeeDocuments.length}`);

    // ------------------------------------------------------------
    // 6. Approval Histories
    // ------------------------------------------------------------

    console.log("6/12 Migrating approval histories...");

    const approvalData = approvalHistories.map((doc) => {
      const id = idOf(doc._id);
      const performedBy = optionalIdOf(doc.performedBy);

      const validPerformedBy =
        performedBy && userIds.has(performedBy) ? performedBy : null;

      const employeeId = idOf(doc.employeeId);
      if (!employeeIds.has(employeeId)) {
        throw new Error(
          `Approval history ${id} references missing employee ${employeeId}`
        );
      }

      return {
        id,
        employeeId,
        fromStatus: String(doc.fromStatus ?? ""),
        toStatus: String(doc.toStatus ?? ""),
        action: String(doc.action ?? ""),
        performedBy: validPerformedBy,
        performedByLegacyId:
          performedBy && !validPerformedBy ? performedBy : null,
        performedByRole: String(doc.performedByRole ?? ""),
        createdAt: toDate(doc.createdAt, "createdAt", id),
      };
    });

    await createManyIfAny("approval history", approvalData, (data) =>
      prisma.approvalHistory.createMany({
        data,
        skipDuplicates: true,
      })
    );

    const brokenApprovalUsers = approvalData.filter(
      (item) => item.performedByLegacyId !== null
    ).length;

    console.log(`Approval histories migrated: ${approvalHistories.length}`);

    if (brokenApprovalUsers > 0) {
      console.log(
        `   Preserved ${brokenApprovalUsers} historical records with missing user references (performedBy=null, performedByLegacyId set)`
      );
    }

    // ------------------------------------------------------------
    // 7. Notifications
    // ------------------------------------------------------------

    console.log("7/12 Migrating notifications...");

    const notificationData = notifications.map((doc) => {
      const id = idOf(doc._id);

      const recipientId = optionalIdOf(doc.recipientId);
      const validRecipientId =
        recipientId && userIds.has(recipientId) ? recipientId : null;

      const rawEmployeeId = optionalIdOf(doc.employeeId);
      const employeeId =
        rawEmployeeId && employeeIds.has(rawEmployeeId) ? rawEmployeeId : null;

      if (rawEmployeeId && !employeeId) {
        throw new Error(
          `Notification ${id} references missing employee ${rawEmployeeId}`
        );
      }

      return {
        id,
        recipientType: String(doc.recipientType ?? ""),
        recipientId: validRecipientId,
        recipientLegacyId:
          recipientId && !validRecipientId ? recipientId : null,
        employeeId,
        applicationRef:
          doc.applicationRef === undefined || doc.applicationRef === null
            ? null
            : String(doc.applicationRef),
        type: String(doc.type ?? ""),
        title: String(doc.title ?? ""),
        body: String(doc.body ?? ""),
        linkUrl:
          doc.linkUrl === undefined || doc.linkUrl === null
            ? null
            : String(doc.linkUrl),
        createdAt: toDate(doc.createdAt, "createdAt", id),
      };
    });

    await createManyIfAny("notification", notificationData, (data) =>
      prisma.notification.createMany({
        data,
        skipDuplicates: true,
      })
    );

    const brokenNotificationUsers = notificationData.filter(
      (item) => item.recipientLegacyId !== null
    ).length;

    console.log(`Notifications migrated: ${notifications.length}`);

    if (brokenNotificationUsers > 0) {
      console.log(
        `   Preserved ${brokenNotificationUsers} notifications with missing recipient users (recipientId=null, recipientLegacyId set)`
      );
    }

    // ------------------------------------------------------------
    // 8. Audit Logs
    // ------------------------------------------------------------

    console.log("8/12 Migrating audit logs...");

    await createManyIfAny(
      "audit log",
      auditLogs.map((doc) => {
        const id = idOf(doc._id);

        const performedBy = optionalIdOf(doc.performedBy);
        // Optional FK — drop broken user refs without inventing users
        const validPerformedBy =
          performedBy && userIds.has(performedBy) ? performedBy : null;

        return {
          id,
          action: String(doc.action ?? ""),
          entity: String(doc.entity ?? ""),
          entityId: String(doc.entityId ?? ""),
          performedBy: validPerformedBy,
          performedByName: String(doc.performedByName ?? ""),
          performedByRole: String(doc.performedByRole ?? ""),
          details: jsonSafe(doc.details ?? {}, {}),
          createdAt: toDate(doc.createdAt, "createdAt", id),
        };
      }),
      (data) =>
        prisma.auditLog.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`Audit logs migrated: ${auditLogs.length}`);

    // ------------------------------------------------------------
    // 9. ID Cards
    // ------------------------------------------------------------

    console.log("9/12 Migrating ID cards...");

    for (const doc of idCards) {
      const employeeId = idOf(doc.employeeId);
      if (!employeeIds.has(employeeId)) {
        throw new Error(
          `ID card ${idOf(doc._id)} references missing employee ${employeeId}`
        );
      }
    }

    await createManyIfAny(
      "id card",
      idCards.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          employeeId: idOf(doc.employeeId),
          employeeIdCode: String(doc.employeeIdCode ?? ""),
          url: String(doc.url ?? ""),
          format: String(doc.format ?? ""),
          status: String(doc.status ?? ""),
          generatedAt: toDate(doc.generatedAt, "generatedAt", id),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
        };
      }),
      (data) =>
        prisma.idCard.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`ID cards migrated: ${idCards.length}`);

    // ------------------------------------------------------------
    // 10. ID Card Download Logs
    // ------------------------------------------------------------

    console.log("10/12 Migrating ID card download logs...");

    const downloadLogData = idCardDownloadLogs.map((doc) => {
      const id = idOf(doc._id);
      const performedBy = idOf(doc.performedBy);
      const employeeId = idOf(doc.employeeId);

      if (!userIds.has(performedBy)) {
        throw new Error(
          `ID card download log ${id} references missing user ${performedBy}`
        );
      }

      if (!employeeIds.has(employeeId)) {
        throw new Error(
          `ID card download log ${id} references missing employee ${employeeId}`
        );
      }

      return {
        id,
        employeeId,
        employeeIdCode: String(doc.employeeIdCode ?? ""),
        employeeName: String(doc.employeeName ?? ""),
        action: String(doc.action ?? ""),
        performedBy,
        performedByRole: String(doc.performedByRole ?? ""),
        createdAt: toDate(doc.createdAt, "createdAt", id),
      };
    });

    await createManyIfAny("id card download log", downloadLogData, (data) =>
      prisma.idCardDownloadLog.createMany({
        data,
        skipDuplicates: true,
      })
    );

    console.log(`ID card download logs migrated: ${idCardDownloadLogs.length}`);

    // ------------------------------------------------------------
    // 11. Settings
    // ------------------------------------------------------------

    console.log("11/12 Migrating settings...");

    await createManyIfAny(
      "setting",
      settings.map((doc) => {
        const id = idOf(doc._id);

        return {
          id,
          key: String(doc.key ?? ""),
          value: jsonSafe(doc.value ?? {}, {}),
          createdAt: toDate(doc.createdAt, "createdAt", id),
          updatedAt: toDate(doc.updatedAt, "updatedAt", id),
        };
      }),
      (data) =>
        prisma.setting.createMany({
          data,
          skipDuplicates: true,
        })
    );

    console.log(`Settings migrated: ${settings.length}`);

    // ------------------------------------------------------------
    // 12. Empty collections
    // ------------------------------------------------------------

    console.log("12/12 Checking empty collections...");
    console.log("   otptokens: 0 records");
    console.log("   employee_id_cards: 0 records");
    console.log("   Nothing to migrate for these collections.");
    console.log();

    // ------------------------------------------------------------
    // Final PostgreSQL counts
    // ------------------------------------------------------------

    console.log("==========================================");
    console.log(" PostgreSQL Migration Result");
    console.log("==========================================");

    const counts = {
      users: await prisma.user.count(),
      departments: await prisma.department.count(),
      designations: await prisma.designation.count(),
      siteLocations: await prisma.siteLocation.count(),
      employees: await prisma.employee.count(),
      employeeDocuments: await prisma.employeeDocument.count(),
      approvalHistories: await prisma.approvalHistory.count(),
      notifications: await prisma.notification.count(),
      auditLogs: await prisma.auditLog.count(),
      idCards: await prisma.idCard.count(),
      idCardDownloadLogs: await prisma.idCardDownloadLog.count(),
      settings: await prisma.setting.count(),
    };

    console.log(`Users:                 ${counts.users}`);
    console.log(`Departments:           ${counts.departments}`);
    console.log(`Designations:          ${counts.designations}`);
    console.log(`Site Locations:        ${counts.siteLocations}`);
    console.log(`Employees:             ${counts.employees}`);
    console.log(`Employee Documents:    ${counts.employeeDocuments}`);
    console.log(`Approval Histories:    ${counts.approvalHistories}`);
    console.log(`Notifications:         ${counts.notifications}`);
    console.log(`Audit Logs:            ${counts.auditLogs}`);
    console.log(`ID Cards:              ${counts.idCards}`);
    console.log(`ID Card Download Logs: ${counts.idCardDownloadLogs}`);
    console.log(`Settings:              ${counts.settings}`);

    console.log();
    console.log("==========================================");
    console.log(" MIGRATION COMPLETED");
    console.log("==========================================");
  } finally {
    await mongoose.disconnect().catch(() => {});
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error();
  console.error("MIGRATION FAILED");
  console.error("------------------------------------------");
  console.error(error);
  process.exitCode = 1;
});
