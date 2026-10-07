import { prisma } from "@/lib/db/prisma";
import { newObjectIdString } from "@/lib/db/ids";
import { logAudit } from "@/lib/services/audit.service";
import { UserRole } from "@/types/enums";
import { canForwardAttendance, canReadAttendance } from "@/features/attendance/access";
import {
  ATTENDANCE_AUDIT,
  AttendanceStatus,
  attendanceCanPreview,
  attendanceFileKindLabel,
  attendanceStatusLabel,
  formatAttendanceDate,
  viewerForRole,
  type AttendanceViewer,
} from "@/features/attendance/constants";
import {
  AttendanceFileError,
  inspectAttendanceUpload,
} from "@/lib/files/attendance-upload";
import {
  deleteAttendanceFile,
  readAttendanceFile,
  saveAttendanceFile,
} from "@/lib/files/attendance-storage";

export class AttendanceError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AttendanceError";
  }
}

export interface AttendanceActor {
  id: string;
  name: string;
  role: string;
}

export interface AttendanceRow {
  id: string;
  serial: number;
  fileName: string;
  fileType: string;
  fileTypeLabel: string;
  status: string;
  statusLabel: string;
  submittedBy: string;
  receivedFrom: string;
  payrollManagerName: string;
  payrollExecutiveName: string;
  dateLabel: string;
  canPreview: boolean;
}

const attendanceSelect = {
  id: true,
  fileName: true,
  storageKey: true,
  fileType: true,
  mimeType: true,
  sizeBytes: true,
  uploadedById: true,
  uploadedByName: true,
  payrollManagerId: true,
  payrollManagerName: true,
  payrollExecutiveId: true,
  payrollExecutiveName: true,
  status: true,
  forwardedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type AttendanceRecord = {
  id: string;
  fileName: string;
  storageKey: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  uploadedByName: string;
  payrollManagerId: string;
  payrollManagerName: string;
  payrollExecutiveId: string | null;
  payrollExecutiveName: string | null;
  status: string;
  forwardedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function scopeFor(actor: AttendanceActor) {
  const viewer = viewerForRole(actor.role);
  if (!viewer) {
    throw new AttendanceError("Forbidden", 403);
  }
  if (viewer === "submitter") return { uploadedById: actor.id };
  if (viewer === "manager") return { payrollManagerId: actor.id };
  return { payrollExecutiveId: actor.id };
}

function toRow(
  record: AttendanceRecord,
  serial: number,
  viewer: AttendanceViewer
): AttendanceRow {
  return {
    id: record.id,
    serial,
    fileName: record.fileName,
    fileType: record.fileType,
    fileTypeLabel: attendanceFileKindLabel(record.fileType),
    status: record.status,
    statusLabel: attendanceStatusLabel(record.status, viewer),
    submittedBy: record.uploadedByName,
    receivedFrom: record.payrollManagerName,
    payrollManagerName: record.payrollManagerName,
    payrollExecutiveName: record.payrollExecutiveName ?? "",
    dateLabel: formatAttendanceDate(
      viewer === "executive" && record.forwardedAt
        ? record.forwardedAt
        : record.createdAt
    ),
    canPreview: attendanceCanPreview(record.fileType),
  };
}

async function auditAttendance(
  actor: AttendanceActor,
  action: string,
  attendanceId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
) {
  await logAudit({
    action,
    entity: "ATTENDANCE",
    entityId: attendanceId,
    performedBy: actor.id,
    performedByName: actor.name,
    performedByRole: actor.role,
    details,
    ipAddress,
  });
}

export async function listActivePayrollManagers() {
  const rows = await prisma.user.findMany({
    where: { role: UserRole.PAYROLL_MANAGER, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function listAssignedExecutives(managerId: string) {
  const rows = await prisma.user.findMany({
    where: {
      role: UserRole.PAYROLL_EXECUTIVE,
      isActive: true,
      assignedPayrollManagerId: managerId,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function submitAttendance(params: {
  actor: AttendanceActor;
  payrollManagerId: string;
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
  ipAddress?: string;
}) {
  if (params.actor.role !== UserRole.SUBMITTER) {
    throw new AttendanceError("Forbidden", 403);
  }

  let inspected;
  try {
    inspected = inspectAttendanceUpload(
      params.fileName,
      params.mimeType,
      params.buffer
    );
  } catch (error) {
    if (error instanceof AttendanceFileError) {
      throw new AttendanceError(error.message, 400);
    }
    throw error;
  }

  const manager = await prisma.user.findFirst({
    where: {
      id: params.payrollManagerId,
      role: UserRole.PAYROLL_MANAGER,
      isActive: true,
    },
    select: { id: true, name: true },
  });
  if (!manager) {
    throw new AttendanceError("Select an active Payroll Manager.", 400);
  }

  const id = newObjectIdString();
  const fileKey = `${id}.${inspected.extension}`;
  let storageKey: string;
  try {
    storageKey = await saveAttendanceFile(fileKey, params.buffer);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Cloudinary upload failed";
    throw new AttendanceError(
      raw.includes("Invalid Signature")
        ? "Cloudinary API secret is invalid. Check CLOUDINARY_API_SECRET."
        : "Unable to store the attendance file.",
      502
    );
  }

  const now = new Date();
  try {
    await prisma.attendance.create({
      data: {
        id,
        fileName: inspected.fileName,
        storageKey,
        fileType: inspected.fileType,
        mimeType: inspected.mimeType,
        sizeBytes: params.buffer.length,
        uploadedById: params.actor.id,
        uploadedByName: params.actor.name,
        payrollManagerId: manager.id,
        payrollManagerName: manager.name,
        status: AttendanceStatus.SUBMITTED_TO_PAYROLL_MANAGER,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    await deleteAttendanceFile(storageKey);
    throw error;
  }

  await auditAttendance(
    params.actor,
    ATTENDANCE_AUDIT.UPLOADED,
    id,
    {
      fileName: inspected.fileName,
      fileType: inspected.fileType,
      payrollManagerId: manager.id,
      payrollManagerName: manager.name,
      status: AttendanceStatus.SUBMITTED_TO_PAYROLL_MANAGER,
    },
    params.ipAddress
  );

  return { id, fileName: inspected.fileName, payrollManagerName: manager.name };
}

export async function listAttendance(actor: AttendanceActor): Promise<AttendanceRow[]> {
  const viewer = viewerForRole(actor.role);
  if (!viewer) throw new AttendanceError("Forbidden", 403);

  const rows = await prisma.attendance.findMany({
    where: scopeFor(actor),
    orderBy: { createdAt: "desc" },
    select: attendanceSelect,
  });

  return rows
    .filter((row) => canReadAttendance(actor, row))
    .map((row, index) => toRow(row, index + 1, viewer));
}

export async function getAttendanceStats(actor: AttendanceActor) {
  const where = scopeFor(actor);
  const [total, forwarded] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.count({
      where: {
        ...where,
        status: AttendanceStatus.FORWARDED_TO_PAYROLL_EXECUTIVE,
      },
    }),
  ]);
  return {
    total,
    forwarded,
    received: total - forwarded,
  };
}

export async function getAttendanceDetail(actor: AttendanceActor, id: string) {
  const viewer = viewerForRole(actor.role);
  if (!viewer) throw new AttendanceError("Forbidden", 403);

  const record = await prisma.attendance.findFirst({
    where: { id, ...scopeFor(actor) },
    select: attendanceSelect,
  });
  if (!record || !canReadAttendance(actor, record)) {
    throw new AttendanceError("Attendance not found", 404);
  }

  await auditAttendance(actor, ATTENDANCE_AUDIT.VIEWED, record.id, {
    fileName: record.fileName,
  });

  return {
    ...toRow(record, 1, viewer),
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    uploadedAtLabel: formatAttendanceDate(record.createdAt),
    forwardedAtLabel: record.forwardedAt
      ? formatAttendanceDate(record.forwardedAt)
      : undefined,
  };
}

export async function openAttendanceFile(
  actor: AttendanceActor,
  id: string,
  mode: "view" | "download" | "embed",
  ipAddress?: string
) {
  const record = await prisma.attendance.findFirst({
    where: { id, ...scopeFor(actor) },
    select: attendanceSelect,
  });
  if (!record || !canReadAttendance(actor, record)) {
    throw new AttendanceError("Attendance not found", 404);
  }

  const buffer = await readAttendanceFile(record.storageKey);
  if (mode !== "embed") {
    await auditAttendance(
      actor,
      mode === "download" ? ATTENDANCE_AUDIT.DOWNLOADED : ATTENDANCE_AUDIT.VIEWED,
      record.id,
      { fileName: record.fileName },
      ipAddress
    );
  }

  return {
    buffer,
    fileName: record.fileName,
    mimeType: record.mimeType,
  };
}

export async function forwardAttendance(params: {
  actor: AttendanceActor;
  attendanceId: string;
  payrollExecutiveId: string;
  ipAddress?: string;
}) {
  if (params.actor.role !== UserRole.PAYROLL_MANAGER) {
    throw new AttendanceError("Forbidden", 403);
  }

  const [record, executive] = await Promise.all([
    prisma.attendance.findFirst({
      where: {
        id: params.attendanceId,
        payrollManagerId: params.actor.id,
      },
      select: attendanceSelect,
    }),
    prisma.user.findFirst({
      where: { id: params.payrollExecutiveId, isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        assignedPayrollManagerId: true,
      },
    }),
  ]);

  if (!record || !canReadAttendance(params.actor, record)) {
    throw new AttendanceError("Attendance not found", 404);
  }
  if (
    !executive ||
    !canForwardAttendance(params.actor, record, {
      id: executive.id,
      role: executive.role,
      assignedPayrollManagerId: executive.assignedPayrollManagerId,
    })
  ) {
    throw new AttendanceError(
      "You can only forward attendance to Payroll Executives assigned to you.",
      403
    );
  }

  const now = new Date();
  await prisma.attendance.update({
    where: { id: record.id },
    data: {
      payrollExecutiveId: executive.id,
      payrollExecutiveName: executive.name,
      status: AttendanceStatus.FORWARDED_TO_PAYROLL_EXECUTIVE,
      forwardedAt: now,
      updatedAt: now,
    },
  });

  await auditAttendance(
    params.actor,
    ATTENDANCE_AUDIT.FORWARDED,
    record.id,
    {
      fileName: record.fileName,
      payrollExecutiveId: executive.id,
      payrollExecutiveName: executive.name,
      status: AttendanceStatus.FORWARDED_TO_PAYROLL_EXECUTIVE,
    },
    params.ipAddress
  );

  return { id: record.id, executiveName: executive.name };
}
