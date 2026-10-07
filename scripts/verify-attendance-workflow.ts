import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { newObjectIdString } from "../src/lib/db/ids";
import { canForwardAttendance, canReadAttendance } from "../src/features/attendance/access";
import { AttendanceStatus } from "../src/features/attendance/constants";
import { inspectAttendanceUpload, AttendanceFileError } from "../src/lib/files/attendance-upload";
import { UserRole } from "../src/types/enums";

const databaseUrl = process.env.DATABASE_URL?.trim() || process.env.DATABASE_URI?.trim();
const prisma = databaseUrl
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    })
  : null;

const TAG = "attendance-verify.local";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function xlsxBuffer(): Buffer {
  return Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from("attendance-verify"),
  ]);
}

async function cleanup() {
  if (!prisma) return;
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${TAG}` } },
    select: { id: true },
  });
  const ids = users.map((user) => user.id);
  if (ids.length === 0) return;
  const files = await prisma.attendance.findMany({
    where: {
      OR: [
        { uploadedById: { in: ids } },
        { payrollManagerId: { in: ids } },
        { payrollExecutiveId: { in: ids } },
      ],
    },
    select: { storageKey: true },
  });
  const { deleteAttendanceFile } = await import("../src/lib/files/attendance-storage");
  await Promise.all(files.map((file) => deleteAttendanceFile(file.storageKey)));
  await prisma.attendance.deleteMany({
    where: {
      OR: [
        { uploadedById: { in: ids } },
        { payrollManagerId: { in: ids } },
        { payrollExecutiveId: { in: ids } },
      ],
    },
  });
  await prisma.auditLog.deleteMany({ where: { performedBy: { in: ids } } });
  await prisma.user.deleteMany({
    where: { id: { in: ids }, role: UserRole.PAYROLL_EXECUTIVE },
  });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function createUser(params: {
  name: string;
  email: string;
  role: string;
  assignedPayrollManagerId?: string;
}) {
  const now = new Date();
  if (!prisma) throw new Error("DATABASE_URL is not configured");
  return prisma.user.create({
    data: {
      id: newObjectIdString(),
      email: params.email,
      name: params.name,
      role: params.role,
      passwordHash: await hashPassword("Verify@123"),
      isActive: true,
      failedLoginAttempts: 0,
      assignedPayrollManagerId: params.assignedPayrollManagerId ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
}

function pureChecks() {
  const record = {
    uploadedById: "submitter",
    payrollManagerId: "rahul",
    payrollExecutiveId: "amit" as string | null,
  };
  assert(canReadAttendance({ id: "submitter", role: UserRole.SUBMITTER }, record), "submitter can read own");
  assert(!canReadAttendance({ id: "other", role: UserRole.SUBMITTER }, record), "other submitter blocked");
  assert(canReadAttendance({ id: "rahul", role: UserRole.PAYROLL_MANAGER }, record), "selected manager can read");
  assert(!canReadAttendance({ id: "suresh", role: UserRole.PAYROLL_MANAGER }, record), "other manager blocked");
  assert(canReadAttendance({ id: "amit", role: UserRole.PAYROLL_EXECUTIVE }, record), "assigned executive can read");
  assert(!canReadAttendance({ id: "priya", role: UserRole.PAYROLL_EXECUTIVE }, record), "other executive blocked");
  assert(
    !canReadAttendance(
      { id: "priya", role: UserRole.PAYROLL_EXECUTIVE },
      { ...record, payrollExecutiveId: null }
    ),
    "unforwarded file hidden from executives"
  );
  assert(
    canForwardAttendance(
      { id: "rahul", role: UserRole.PAYROLL_MANAGER },
      record,
      { id: "amit", role: UserRole.PAYROLL_EXECUTIVE, assignedPayrollManagerId: "rahul" }
    ),
    "manager can forward to own executive"
  );
  assert(
    !canForwardAttendance(
      { id: "rahul", role: UserRole.PAYROLL_MANAGER },
      record,
      { id: "raj", role: UserRole.PAYROLL_EXECUTIVE, assignedPayrollManagerId: "suresh" }
    ),
    "manager cannot forward to another manager's executive"
  );

  const file = inspectAttendanceUpload("Attendance_September.xlsx", "", xlsxBuffer());
  assert(file.fileType === "EXCEL", "xlsx detected as Excel");
  let rejected = false;
  try {
    inspectAttendanceUpload("notes.exe", "application/octet-stream", xlsxBuffer());
  } catch (error) {
    rejected = error instanceof AttendanceFileError;
  }
  assert(rejected, "unsupported extension rejected");
  console.log("pure access and file checks passed");
}

async function main() {
  pureChecks();
  if (!databaseUrl) {
    console.log("DATABASE_URL missing; skipped database workflow");
    return;
  }

  await cleanup();
  const rahul = await createUser({
    name: "Rahul Sharma",
    email: `rahul@${TAG}`,
    role: UserRole.PAYROLL_MANAGER,
  });
  const suresh = await createUser({
    name: "Suresh Kumar",
    email: `suresh@${TAG}`,
    role: UserRole.PAYROLL_MANAGER,
  });
  const amit = await createUser({
    name: "Amit",
    email: `amit@${TAG}`,
    role: UserRole.PAYROLL_EXECUTIVE,
    assignedPayrollManagerId: rahul.id,
  });
  const priya = await createUser({
    name: "Priya",
    email: `priya@${TAG}`,
    role: UserRole.PAYROLL_EXECUTIVE,
    assignedPayrollManagerId: rahul.id,
  });
  const raj = await createUser({
    name: "Raj",
    email: `raj@${TAG}`,
    role: UserRole.PAYROLL_EXECUTIVE,
    assignedPayrollManagerId: suresh.id,
  });
  const submitter = await createUser({
    name: "Test Submitter",
    email: `submitter@${TAG}`,
    role: UserRole.SUBMITTER,
  });

  const { submitAttendance, listAttendance, forwardAttendance, openAttendanceFile } =
    await import("../src/lib/services/attendance.service");

  const created = await submitAttendance({
    actor: { id: submitter.id, name: submitter.name, role: submitter.role },
    payrollManagerId: rahul.id,
    fileName: "Attendance_September.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: xlsxBuffer(),
  });

  const rahulRows = await listAttendance({ id: rahul.id, name: rahul.name, role: rahul.role });
  const sureshRows = await listAttendance({ id: suresh.id, name: suresh.name, role: suresh.role });
  assert(rahulRows.some((row) => row.id === created.id), "Rahul Sharma can see the upload");
  assert(!sureshRows.some((row) => row.id === created.id), "Suresh Kumar cannot see the upload");

  let blocked = false;
  try {
    await forwardAttendance({
      actor: { id: rahul.id, name: rahul.name, role: rahul.role },
      attendanceId: created.id,
      payrollExecutiveId: raj.id,
    });
  } catch {
    blocked = true;
  }
  assert(blocked, "Rahul cannot forward to Raj");

  await forwardAttendance({
    actor: { id: rahul.id, name: rahul.name, role: rahul.role },
    attendanceId: created.id,
    payrollExecutiveId: amit.id,
  });

  const amitRows = await listAttendance({ id: amit.id, name: amit.name, role: amit.role });
  const priyaRows = await listAttendance({ id: priya.id, name: priya.name, role: priya.role });
  const rajRows = await listAttendance({ id: raj.id, name: raj.name, role: raj.role });
  assert(amitRows.some((row) => row.id === created.id), "Amit can see the forwarded file");
  assert(!priyaRows.some((row) => row.id === created.id), "Priya cannot see Amit's file");
  assert(!rajRows.some((row) => row.id === created.id), "Raj cannot see Amit's file");

  let priyaBlocked = false;
  try {
    await openAttendanceFile(
      { id: priya.id, name: priya.name, role: priya.role },
      created.id,
      "download"
    );
  } catch {
    priyaBlocked = true;
  }
  assert(priyaBlocked, "Priya cannot download by changing the id");

  const downloaded = await openAttendanceFile(
    { id: amit.id, name: amit.name, role: amit.role },
    created.id,
    "download"
  );
  assert(downloaded.fileName === "Attendance_September.xlsx", "original filename preserved");
  assert(downloaded.buffer.equals(xlsxBuffer()), "original bytes preserved");

  const stored = await prisma?.attendance.findUnique({ where: { id: created.id } });
  assert(stored?.status === AttendanceStatus.FORWARDED_TO_PAYROLL_EXECUTIVE, "status forwarded");
  assert(stored?.payrollExecutiveId === amit.id, "executive stored");
  assert(stored?.payrollManagerId === rahul.id, "manager stored");

  console.log("database attendance workflow passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (databaseUrl) {
      await cleanup().catch((error) => {
        console.error("cleanup failed", error);
        process.exitCode = 1;
      });
    }
    await prisma?.$disconnect();
  });
