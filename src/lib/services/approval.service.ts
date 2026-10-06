import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { newObjectIdString } from "@/lib/db/ids";
import { EmployeeStatus, UserRole } from "@/types/enums";
import { generateTemporaryEmployeeId } from "@/lib/services/employee-id.service";
import {
  asRecord,
  decisionAction,
  isLikelyObjectIdString,
  isPendingL2Review,
  normalizeId,
} from "@/lib/services/approval-queue";
import {
  dispatchApplicationSubmitted,
  dispatchL1Approved,
  dispatchL2Approved,
  dispatchCorrectionRequired,
  dispatchRejected,
  dispatchForwardedToSupport,
  employeeNotifyContext,
} from "@/lib/services/notification-dispatch.service";

export class ApprovalError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "ApprovalError";
  }
}

function isTransientDbError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timed out|timeout|ECONNRESET|ENOTFOUND|MongoNetwork|MongoServerSelection|connection|Prisma|postgres/i.test(
    message
  );
}

async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isTransientDbError(error)) throw error;
    return fn();
  }
}

export function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function describeApprovalFailure(error: unknown, fallback: string): string {
  if (error instanceof ApprovalError) return error.message;
  if (isTransientDbError(error)) {
    return "Connection timed out. Please click Approve again.";
  }
  if (error instanceof Error && error.message && error.message.length < 160) {
    return error.message;
  }
  return fallback;
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function recordHistory(params: {
  employeeId: string;
  fromStatus: string;
  toStatus: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  comment?: string;
  createdAt?: Date;
}) {
  const createdAt = params.createdAt ?? new Date();
  await prisma.approvalHistory.create({
    data: {
      id: newObjectIdString(),
      employeeId: params.employeeId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      action: params.action,
      performedBy: params.performedBy,
      performedByRole: params.performedByRole,
      comment: params.comment,
      createdAt,
    },
  });
}

export async function assignL1OnSubmit(
  employeeId: string,
  options?: { performedBy?: string; isResubmit?: boolean }
): Promise<void> {
  const l1User = await prisma.user.findFirst({
    where: { role: UserRole.L1, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return;

  const fromStatus = employee.status;
  const assignedL1Id = l1User?.id ?? null;
  const now = new Date();

  const performer =
    options?.performedBy || employee.submittedBy || l1User?.id || undefined;

  if (performer) {
    await prisma.$transaction([
      prisma.employee.update({
        where: { id: employeeId },
        data: {
          status: EmployeeStatus.L1_REVIEW,
          assignedL1Id,
          updatedAt: now,
        },
      }),
      prisma.approvalHistory.create({
        data: {
          id: newObjectIdString(),
          employeeId,
          fromStatus,
          toStatus: EmployeeStatus.L1_REVIEW,
          action: options?.isResubmit ? "RESUBMIT" : "SUBMIT",
          performedBy: performer,
          performedByRole: UserRole.SUBMITTER,
          comment: options?.isResubmit
            ? "Registration updated and resubmitted"
            : "Registration submitted for L1 approval",
          createdAt: now,
        },
      }),
    ]);
  } else {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.L1_REVIEW,
        assignedL1Id,
        updatedAt: now,
      },
    });
  }

  // Notifications remain MongoDB / fire-and-forget (Phase 7)
  void dispatchApplicationSubmitted(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    }),
    l1User?.id
  ).catch(() => undefined);
}

export async function performL1Approve(
  employeeId: string,
  reviewerId: string,
  approvedByName: string,
  comment?: string
): Promise<{ employeeIdCode?: string }> {
  const trimmedName = approvedByName?.trim() ?? "";
  if (trimmedName.length < 2) {
    throw new ApprovalError("Enter the L1 name in Approved by", "VALIDATION");
  }
  if (!isLikelyObjectIdString(employeeId)) {
    throw new ApprovalError("Application not found", "NOT_FOUND");
  }
  if (!isLikelyObjectIdString(reviewerId)) {
    throw new ApprovalError("Please sign in again to approve", "AUTH");
  }

  const now = new Date();
  const l1Decision = {
    action: "APPROVE" as const,
    comment,
    approvedByName: trimmedName,
    decidedBy: reviewerId,
    decidedAt: now.toISOString(),
  };

  const updated = await retryOnce(() =>
    prisma.employee.updateMany({
      where: {
        id: employeeId,
        status: {
          in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW],
        },
      },
      data: {
        status: EmployeeStatus.L2_REVIEW,
        l1Decision: asInputJson(l1Decision),
        l1ApprovedAt: now,
        correctionNotes: null,
        l2Decision: Prisma.DbNull,
        updatedAt: now,
      },
    })
  );

  if (updated.count === 0) {
    const existing = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { status: true, l1Decision: true },
    });
    if (!existing) throw new ApprovalError("Application not found", "NOT_FOUND");
    if (
      existing.status === EmployeeStatus.L2_REVIEW &&
      decisionAction(existing.l1Decision) === "APPROVE"
    ) {
      return {};
    }
    throw new ApprovalError("Application is not in L1 review", "INVALID_STATUS");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return {};

  void recordHistory({
    employeeId,
    fromStatus: EmployeeStatus.L1_REVIEW,
    toStatus: EmployeeStatus.L2_REVIEW,
    action: "L1_APPROVE",
    performedBy: reviewerId,
    performedByRole: UserRole.L1,
    comment: [`Approved by ${trimmedName}`, comment?.trim()]
      .filter(Boolean)
      .join(" — "),
  }).catch((error) => console.error("[l1-approve] history", error));

  void dispatchL1Approved(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    })
  ).catch(() => undefined);

  return {};
}

export async function performL1Reject(
  employeeId: string,
  reviewerId: string,
  comment: string
): Promise<void> {
  if (!comment || comment.trim().length < 10) {
    throw new ApprovalError(
      "Rejection reason must be at least 10 characters",
      "VALIDATION"
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new ApprovalError("Application not found", "NOT_FOUND");

  const allowed = [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW];
  if (!allowed.includes(employee.status as EmployeeStatus)) {
    throw new ApprovalError("Application is not in L1 review", "INVALID_STATUS");
  }

  const fromStatus = employee.status;
  const now = new Date();
  const l1Decision = {
    action: "REJECT" as const,
    comment,
    decidedBy: reviewerId,
    decidedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.REJECTED,
        rejectionReason: comment,
        l1Decision: asInputJson(l1Decision),
        updatedAt: now,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        id: newObjectIdString(),
        employeeId,
        fromStatus,
        toStatus: EmployeeStatus.REJECTED,
        action: "L1_REJECT",
        performedBy: reviewerId,
        performedByRole: UserRole.L1,
        comment,
        createdAt: now,
      },
    }),
  ]);

  void dispatchRejected(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    }),
    "L1",
    comment
  ).catch(() => undefined);
}

export async function performL1Return(
  employeeId: string,
  reviewerId: string,
  comment: string
): Promise<void> {
  if (!comment || comment.trim().length < 10) {
    throw new ApprovalError(
      "Correction notes must be at least 10 characters",
      "VALIDATION"
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new ApprovalError("Application not found", "NOT_FOUND");

  const allowed = [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW];
  if (!allowed.includes(employee.status as EmployeeStatus)) {
    throw new ApprovalError("Application is not in L1 review", "INVALID_STATUS");
  }

  const fromStatus = employee.status;
  const now = new Date();
  const l1Decision = {
    action: "RETURN" as const,
    comment,
    decidedBy: reviewerId,
    decidedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.L1_RETURNED,
        correctionNotes: comment,
        l1Decision: asInputJson(l1Decision),
        updatedAt: now,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        id: newObjectIdString(),
        employeeId,
        fromStatus,
        toStatus: EmployeeStatus.L1_RETURNED,
        action: "L1_RETURN",
        performedBy: reviewerId,
        performedByRole: UserRole.L1,
        comment,
        createdAt: now,
      },
    }),
  ]);

  void dispatchCorrectionRequired(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    }),
    "L1",
    comment
  ).catch(() => undefined);
}

export async function getEmployeeDetailForReview(employeeId: string) {
  const [employee, documents, history] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.employeeDocument.findMany({
      where: { employeeId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.approvalHistory.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        performer: { select: { name: true } },
      },
    }),
  ]);

  if (!employee) return null;

  const userIds = new Set<string>();
  if (employee.submittedBy) userIds.add(employee.submittedBy);
  for (const key of ["l1Decision", "l2Decision", "scanningDecision"] as const) {
    const id = normalizeId(asRecord(employee[key])?.decidedBy);
    if (id) userIds.add(id);
  }

  const users =
    userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  function withDecidedBy(decision: unknown) {
    const rec = asRecord(decision);
    if (!rec) return decision;
    const decidedById = normalizeId(rec.decidedBy);
    const user = decidedById ? userMap.get(decidedById) : undefined;
    return {
      ...rec,
      decidedBy: user
        ? { name: user.name, email: user.email }
        : rec.decidedBy && typeof rec.decidedBy === "object"
          ? rec.decidedBy
          : decidedById
            ? { name: undefined, email: undefined }
            : null,
    };
  }

  const submittedByUser = employee.submittedBy
    ? userMap.get(employee.submittedBy)
    : undefined;

  const shapedEmployee = {
    _id: employee.id,
    applicationRef: employee.applicationRef,
    status: employee.status as EmployeeStatus,
    email: employee.email,
    phone: employee.phone,
    employeeId: employee.employeeId ?? undefined,
    temporaryEmployeeId: employee.temporaryEmployeeId ?? undefined,
    personalDetails: employee.personalDetails,
    address: employee.address,
    education: employee.education,
    references: employee.references,
    familyDetails: employee.familyDetails,
    nominee: employee.nominee,
    exServiceman: employee.exServiceman,
    gunman: employee.gunman,
    additionalDetails: employee.additionalDetails,
    declaration: employee.declaration,
    submittedAt: employee.submittedAt,
    submittedBy: submittedByUser
      ? { name: submittedByUser.name, email: submittedByUser.email }
      : employee.submittedBy,
    submittedByName: employee.submittedByName,
    submittedByEmail: employee.submittedByEmail,
    l1Decision: withDecidedBy(employee.l1Decision) as {
      action?: unknown;
      comment?: unknown;
      approvedByName?: unknown;
      decidedAt?: unknown;
      decidedBy?: unknown;
    } | null,
    l2Decision: withDecidedBy(employee.l2Decision) as {
      action?: unknown;
      comment?: unknown;
      approvedByName?: unknown;
      decidedAt?: unknown;
      decidedBy?: unknown;
    } | null,
    scanningDecision: withDecidedBy(employee.scanningDecision) as {
      action?: unknown;
      comment?: unknown;
      approvedByName?: unknown;
      decidedAt?: unknown;
      decidedBy?: unknown;
    } | null,
    scanningCompletedAt: employee.scanningCompletedAt,
    correctionNotes: employee.correctionNotes ?? undefined,
    rejectionReason: employee.rejectionReason ?? undefined,
    forwardedToSupportAt: employee.forwardedToSupportAt,
    forwardedToAdminAt: employee.forwardedToAdminAt,
    pendingFieldChanges: employee.pendingFieldChanges,
    documentsFolder: employee.documentsFolder,
  };

  const shapedDocuments = documents.map((d) => ({
    _id: d.id,
    documentType: d.documentType,
    fileName: d.fileName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    url: d.url,
    folderLabel: d.folderLabel ?? undefined,
    folderRelativePath: d.folderRelativePath ?? undefined,
    version: d.version,
    createdAt: d.createdAt,
  }));

  const shapedHistory = history.map((h) => ({
    action: h.action,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    comment: h.comment ?? undefined,
    createdAt: h.createdAt,
    performedBy: h.performer ? { name: h.performer.name } : undefined,
    performedByRole: h.performedByRole,
  }));

  return {
    employee: shapedEmployee,
    documents: shapedDocuments,
    history: shapedHistory,
  };
}

function assertPendingL2Review(employee: {
  status: string;
  l1Decision?: unknown;
  l2Decision?: unknown;
  forwardedToSupportAt?: Date | null;
  forwardedToAdminAt?: Date | null;
}) {
  if (
    !isPendingL2Review({
      status: employee.status as EmployeeStatus,
      l1Decision: asRecord(employee.l1Decision) as { action?: string } | null,
      l2Decision: asRecord(employee.l2Decision) as { action?: string } | null,
      forwardedToAdminAt: employee.forwardedToAdminAt,
      forwardedToSupportAt: employee.forwardedToSupportAt,
    })
  ) {
    throw new ApprovalError("Application is not in L2 review", "INVALID_STATUS");
  }
}

export async function performL2Approve(
  employeeId: string,
  reviewerId: string,
  comment?: string
): Promise<{ employeeIdCode?: string }> {
  if (!isLikelyObjectIdString(employeeId)) {
    throw new ApprovalError("Application not found", "NOT_FOUND");
  }
  if (!isLikelyObjectIdString(reviewerId)) {
    throw new ApprovalError("Please sign in again to approve", "AUTH");
  }

  const employee = await retryOnce(() =>
    prisma.employee.findUnique({ where: { id: employeeId } })
  );
  if (!employee) throw new ApprovalError("Application not found", "NOT_FOUND");

  const alreadyDone =
    decisionAction(employee.l2Decision) === "APPROVE" ||
    decisionAction(employee.l2Decision) === "FORWARD" ||
    !!employee.forwardedToAdminAt ||
    !!employee.temporaryEmployeeId;

  if (!alreadyDone) {
    assertPendingL2Review(employee);

    const fromStatus = employee.status;
    const now = new Date();
    const l2Decision = {
      action: "APPROVE" as const,
      comment,
      decidedBy: reviewerId,
      decidedAt: now.toISOString(),
    };

    await retryOnce(() =>
      prisma.employee.update({
        where: { id: employeeId },
        data: {
          status: EmployeeStatus.APPROVED,
          l2Decision: asInputJson(l2Decision),
          approvedAt: now,
          updatedAt: now,
        },
      })
    );

    void recordHistory({
      employeeId,
      fromStatus,
      toStatus: EmployeeStatus.APPROVED,
      action: "L2_APPROVE",
      performedBy: reviewerId,
      performedByRole: UserRole.L2,
      comment,
    }).catch((error) => console.error("[l2-approve] history", error));

    void dispatchL2Approved(
      employeeNotifyContext({
        _id: employee.id,
        applicationRef: employee.applicationRef,
        employeeId: employee.employeeId ?? undefined,
        personalDetails: (employee.personalDetails ?? undefined) as
          | Record<string, unknown>
          | undefined,
      })
    ).catch(() => undefined);
  }

  let employeeIdCode = employee.temporaryEmployeeId ?? undefined;

  try {
    const result = await generateTemporaryEmployeeId(employeeId);
    employeeIdCode = result.employeeIdCode;

    void recordHistory({
      employeeId,
      fromStatus: EmployeeStatus.APPROVED,
      toStatus: EmployeeStatus.ID_GENERATED,
      action: "GENERATE_ID",
      performedBy: reviewerId,
      performedByRole: UserRole.L2,
      comment: `Temporary Employee ID ${employeeIdCode} assigned`,
    }).catch(() => undefined);
  } catch (error) {
    console.error("[l2-approve] temp ID", error);
  }

  // Document folder organization remains Mongo/deferred (Documents phase)
  void import("@/lib/services/employee-documents-folder.service")
    .then(({ organizeEmployeeDocumentsFolder }) =>
      organizeEmployeeDocumentsFolder(employeeId)
    )
    .catch(() => undefined);

  try {
    await prisma.employee.updateMany({
      where: {
        id: employeeId,
        forwardedToAdminAt: null,
      },
      data: {
        forwardedToAdminAt: new Date(),
        status: EmployeeStatus.ID_GENERATED,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[l2-approve] forward admin", error);
  }

  return { employeeIdCode };
}

export async function performL2Reject(
  employeeId: string,
  reviewerId: string,
  comment: string
): Promise<void> {
  if (!comment || comment.trim().length < 10) {
    throw new ApprovalError(
      "Rejection reason must be at least 10 characters",
      "VALIDATION"
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new ApprovalError("Application not found", "NOT_FOUND");

  assertPendingL2Review(employee);

  const fromStatus = employee.status;
  const now = new Date();
  const l2Decision = {
    action: "REJECT" as const,
    comment,
    decidedBy: reviewerId,
    decidedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.REJECTED,
        rejectionReason: comment,
        l2Decision: asInputJson(l2Decision),
        updatedAt: now,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        id: newObjectIdString(),
        employeeId,
        fromStatus,
        toStatus: EmployeeStatus.REJECTED,
        action: "L2_REJECT",
        performedBy: reviewerId,
        performedByRole: UserRole.L2,
        comment,
        createdAt: now,
      },
    }),
  ]);

  void dispatchRejected(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    }),
    "L2",
    comment
  ).catch(() => undefined);
}

export async function performL2Return(
  employeeId: string,
  reviewerId: string,
  comment: string
): Promise<void> {
  if (!comment || comment.trim().length < 10) {
    throw new ApprovalError(
      "Send-back notes must be at least 10 characters",
      "VALIDATION"
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new ApprovalError("Application not found", "NOT_FOUND");

  assertPendingL2Review(employee);

  const fromStatus = employee.status;
  const now = new Date();
  const l2Decision = {
    action: "RETURN" as const,
    comment,
    decidedBy: reviewerId,
    decidedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.L2_RETURNED,
        correctionNotes: comment,
        l2Decision: asInputJson(l2Decision),
        updatedAt: now,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        id: newObjectIdString(),
        employeeId,
        fromStatus,
        toStatus: EmployeeStatus.L2_RETURNED,
        action: "L2_RETURN",
        performedBy: reviewerId,
        performedByRole: UserRole.L2,
        comment,
        createdAt: now,
      },
    }),
  ]);

  void dispatchCorrectionRequired(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    }),
    "L2",
    comment
  ).catch(() => undefined);
}

/** L2 sends application back to L1 for re-review with a note. */
export async function performL2ReturnToL1(
  employeeId: string,
  reviewerId: string,
  comment: string
): Promise<void> {
  if (!comment || comment.trim().length < 10) {
    throw new ApprovalError(
      "Send-back notes must be at least 10 characters",
      "VALIDATION"
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new ApprovalError("Application not found", "NOT_FOUND");

  assertPendingL2Review(employee);

  const fromStatus = employee.status;
  const now = new Date();
  const l2Decision = {
    action: "RETURN_TO_L1" as const,
    comment,
    decidedBy: reviewerId,
    decidedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.L1_REVIEW,
        correctionNotes: comment,
        l1Decision: Prisma.DbNull,
        l1ApprovedAt: null,
        l2Decision: asInputJson(l2Decision),
        updatedAt: now,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        id: newObjectIdString(),
        employeeId,
        fromStatus,
        toStatus: EmployeeStatus.L1_REVIEW,
        action: "L2_RETURN_TO_L1",
        performedBy: reviewerId,
        performedByRole: UserRole.L2,
        comment,
        createdAt: now,
      },
    }),
  ]);

  void dispatchCorrectionRequired(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    }),
    "L2",
    comment
  ).catch(() => undefined);
}

export async function performForwardToSupport(
  employeeId: string,
  reviewerId: string,
  comment?: string
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new ApprovalError("Application not found", "NOT_FOUND");

  const allowed = [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED];
  if (!allowed.includes(employee.status as EmployeeStatus)) {
    throw new ApprovalError(
      "Application must be approved before forwarding to Support",
      "INVALID_STATUS"
    );
  }

  if (decisionAction(employee.l2Decision) !== "APPROVE") {
    throw new ApprovalError(
      "Only L2-approved applications can be forwarded",
      "INVALID_STATUS"
    );
  }

  if (employee.forwardedToSupportAt) {
    throw new ApprovalError(
      "Application already forwarded to Support",
      "ALREADY_FORWARDED"
    );
  }

  if (!employee.employeeId && !employee.temporaryEmployeeId) {
    try {
      await generateTemporaryEmployeeId(employeeId);
    } catch {
      throw new ApprovalError(
        "Employee ID must be generated before forwarding to Support",
        "NO_EMPLOYEE_ID"
      );
    }
  }

  try {
    const { organizeEmployeeDocumentsFolder } = await import(
      "@/lib/services/employee-documents-folder.service"
    );
    const current = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { documentsFolder: true },
    });
    const folder = asRecord(current?.documentsFolder);
    if (current && !folder?.folderPath) {
      await organizeEmployeeDocumentsFolder(employeeId);
    }
  } catch {
    // non-blocking
  }

  const fresh = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!fresh) throw new ApprovalError("Application not found", "NOT_FOUND");

  const fromStatus = fresh.status;
  const now = new Date();
  const prevDecision = asRecord(fresh.l2Decision) ?? {};
  const l2Decision = {
    ...prevDecision,
    action: "FORWARD",
    comment: comment ?? prevDecision.comment,
    decidedBy: prevDecision.decidedBy ?? reviewerId,
    decidedAt: now.toISOString(),
  };

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        forwardedToSupportAt: now,
        l2Decision: asInputJson(l2Decision),
        updatedAt: now,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        id: newObjectIdString(),
        employeeId,
        fromStatus,
        toStatus: fresh.status,
        action: "L2_FORWARD",
        performedBy: reviewerId,
        performedByRole: UserRole.L2,
        comment,
        createdAt: now,
      },
    }),
  ]);

  void dispatchForwardedToSupport(
    employeeNotifyContext({
      _id: fresh.id,
      applicationRef: fresh.applicationRef,
      employeeId: fresh.employeeId ?? undefined,
      personalDetails: (fresh.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    })
  ).catch(() => undefined);
}
