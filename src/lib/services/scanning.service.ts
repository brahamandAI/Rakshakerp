import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { EmployeeStatus, UserRole } from "@/types/enums";
import {
  ApplicationListItem,
  listSelect,
  mapRows,
} from "@/lib/services/l1.service";
import {
  isLikelyObjectIdString,
  isScanningCompletedEmployee,
  isScanningPendingEmployee,
} from "@/lib/services/approval-queue";
import { newObjectIdString } from "@/lib/db/ids";

export class ScanningError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "ScanningError";
  }
}

export async function getScanningStats() {
  const candidates = await prisma.employee.findMany({
    where: {
      OR: [
        {
          status: {
            in: [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED],
          },
          forwardedToAdminAt: { not: null },
          temporaryEmployeeId: { not: null },
        },
        {
          scanningCompletedAt: { not: null },
        },
      ],
    },
    select: {
      id: true,
      status: true,
      forwardedToAdminAt: true,
      temporaryEmployeeId: true,
      scanningCompletedAt: true,
      scanningDecision: true,
      l2Decision: true,
    },
  });

  let pending = 0;
  let completed = 0;
  for (const emp of candidates) {
    if (isScanningPendingEmployee(emp)) pending += 1;
    if (isScanningCompletedEmployee(emp)) completed += 1;
  }
  const all = pending + completed;
  return { pending, completed, all };
}

export async function getScanningPendingApplications(): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      status: { in: [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED] },
      forwardedToAdminAt: { not: null },
      temporaryEmployeeId: { not: null },
      scanningCompletedAt: null,
    },
    select: listSelect,
    orderBy: [{ forwardedToAdminAt: "desc" }, { approvedAt: "desc" }],
    take: 1000,
  });

  return mapRows(candidates.filter((e) => isScanningPendingEmployee(e)).slice(0, 500));
}

export async function getScanningRecentPending(
  limit = 5
): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      status: { in: [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED] },
      forwardedToAdminAt: { not: null },
      temporaryEmployeeId: { not: null },
      scanningCompletedAt: null,
    },
    select: listSelect,
    orderBy: [{ forwardedToAdminAt: "desc" }, { approvedAt: "desc" }],
    take: limit * 4,
  });

  return mapRows(
    candidates.filter((e) => isScanningPendingEmployee(e)).slice(0, limit)
  );
}

export async function getScanningCompletedApplications(): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: { scanningCompletedAt: { not: null } },
    select: listSelect,
    orderBy: { scanningCompletedAt: "desc" },
    take: 1000,
  });

  const matched = candidates
    .filter((e) => isScanningCompletedEmployee(e))
    .slice(0, 500);

  return mapRows(matched);
}

export async function getScanningAllApplications(): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      OR: [
        {
          status: {
            in: [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED],
          },
          forwardedToAdminAt: { not: null },
          temporaryEmployeeId: { not: null },
          scanningCompletedAt: null,
        },
        { scanningCompletedAt: { not: null } },
      ],
    },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });

  const matched = candidates
    .filter(
      (e) => isScanningPendingEmployee(e) || isScanningCompletedEmployee(e)
    )
    .slice(0, 1000);

  return mapRows(matched);
}

export async function performScanningComplete(
  employeeId: string,
  reviewerId: string,
  scanningCompleted: boolean,
  comment?: string
): Promise<void> {
  if (!scanningCompleted) {
    throw new ScanningError(
      "Please confirm Scanning Completed before approving",
      "VALIDATION"
    );
  }
  if (
    !isLikelyObjectIdString(employeeId) ||
    !isLikelyObjectIdString(reviewerId)
  ) {
    throw new ScanningError("Invalid request", "VALIDATION");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new ScanningError("Application not found", "NOT_FOUND");

  if (employee.scanningCompletedAt) {
    return;
  }

  if (!isScanningPendingEmployee(employee)) {
    throw new ScanningError("Application is not pending scanning", "INVALID_STATUS");
  }

  const fromStatus = employee.status;
  const now = new Date();
  const scanningDecision = {
    action: "APPROVE",
    scanningCompleted: true,
    comment,
    decidedBy: reviewerId,
    decidedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        scanningDecision: scanningDecision as Prisma.InputJsonValue,
        scanningCompletedAt: now,
        status: EmployeeStatus.SCANNING_COMPLETED,
        updatedAt: now,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        id: newObjectIdString(),
        employeeId,
        fromStatus,
        toStatus: EmployeeStatus.SCANNING_COMPLETED,
        action: "SCANNING_COMPLETE",
        performedBy: reviewerId,
        performedByRole: UserRole.SCANNING,
        comment: comment || "Scanning completed",
        createdAt: now,
      },
    }),
  ]);
}
