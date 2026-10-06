import { EmployeeStatus } from "@/types/enums";

/** Applications waiting for L1 review (Mongo shape — kept for deferred export/admin/submitter). */
export const L1_PENDING_FILTER = {
  status: { $in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW] },
};

export const L2_REVIEWABLE_STATUSES = [EmployeeStatus.L2_REVIEW] as const;

type L2ReviewCheck = {
  status: EmployeeStatus | string;
  l1Decision?: { action?: string } | null;
  l2Decision?: { action?: string } | null;
  forwardedToAdminAt?: unknown;
  forwardedToSupportAt?: unknown;
};

/** True when L2 can still approve or reject the application */
export function isPendingL2Review(employee: L2ReviewCheck): boolean {
  if (employee.forwardedToAdminAt || employee.forwardedToSupportAt) return false;
  if (decisionAction(employee.l1Decision) !== "APPROVE") return false;
  const l2Action = decisionAction(employee.l2Decision);
  if (l2Action && ["APPROVE", "FORWARD", "REJECT", "RETURN"].includes(l2Action)) {
    return false;
  }
  return L2_REVIEWABLE_STATUSES.includes(
    employee.status as (typeof L2_REVIEWABLE_STATUSES)[number]
  );
}

/**
 * Applications waiting for L2 review after L1 approval.
 * Temporary Employee ID is generated only after L2 approval.
 * (Mongo shape — kept for deferred export consumers.)
 */
export const L2_PENDING_FILTER = {
  "l1Decision.action": "APPROVE",
  forwardedToAdminAt: { $exists: false },
  forwardedToSupportAt: { $exists: false },
  status: EmployeeStatus.L2_REVIEW,
  $or: [
    { l2Decision: { $exists: false } },
    { "l2Decision.action": { $nin: ["APPROVE", "FORWARD", "REJECT", "RETURN"] } },
  ],
};

/** Registrations L2-approved and waiting for Scanning (Mongo shape). */
export const SCANNING_PENDING_FILTER = {
  forwardedToAdminAt: { $exists: true },
  temporaryEmployeeId: { $exists: true, $ne: null },
  "l2Decision.action": { $in: ["APPROVE", "FORWARD"] },
  scanningCompletedAt: { $exists: false },
  status: {
    $in: [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED],
  },
};

/** Registrations marked scanning completed (Mongo shape). */
export const SCANNING_COMPLETED_FILTER = {
  scanningCompletedAt: { $exists: true },
  "scanningDecision.action": "APPROVE",
};

/** Registrations L2-approved and sent to Admin (Mongo shape — deferred). */
export const ADMIN_REGISTRATIONS_FILTER = {
  forwardedToAdminAt: { $exists: true },
  temporaryEmployeeId: { $exists: true, $ne: null },
  "l2Decision.action": { $in: ["APPROVE", "FORWARD"] },
  status: {
    $in: [
      EmployeeStatus.APPROVED,
      EmployeeStatus.ID_GENERATED,
      EmployeeStatus.SCANNING_COMPLETED,
      EmployeeStatus.ID_CARD_ISSUED,
    ],
  },
};

/** Employees forwarded to Support (Mongo shape — deferred). */
export const SUPPORT_PENDING_FILTER = {
  forwardedToSupportAt: { $exists: true },
  employeeId: { $exists: true, $ne: null },
  "l2Decision.action": { $in: ["APPROVE", "FORWARD"] },
  status: { $in: [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED] },
};

// ---------------------------------------------------------------------------
// JSON decision helpers + TypeScript predicates for Prisma queue filtering
// ---------------------------------------------------------------------------

export type DecisionLike = {
  action?: string;
  comment?: string;
  approvedByName?: string;
  decidedAt?: string | Date;
  decidedBy?: unknown;
  scanningCompleted?: boolean;
} | null;

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function decisionAction(decision: unknown): string | undefined {
  const rec = asRecord(decision);
  const action = rec?.action;
  return typeof action === "string" ? action : undefined;
}

/** Normalize decidedBy stored as string, ObjectId-like, or {$oid}. */
export function decisionDecidedById(decision: unknown): string | undefined {
  const rec = asRecord(decision);
  if (!rec) return undefined;
  return normalizeId(rec.decidedBy);
}

export function normalizeId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (typeof rec.$oid === "string") return rec.$oid;
    if (typeof rec.id === "string") return rec.id;
    if (typeof rec._id === "string") return rec._id;
    if (typeof (value as { toHexString?: () => string }).toHexString === "function") {
      return (value as { toHexString: () => string }).toHexString();
    }
    if (typeof (value as { toString?: () => string }).toString === "function") {
      const s = (value as { toString: () => string }).toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  return undefined;
}

export function decidedByMatches(decision: unknown, userId: string): boolean {
  const id = decisionDecidedById(decision);
  return Boolean(id && id === userId);
}

export function isL1PendingEmployee(emp: { status: string }): boolean {
  return (
    emp.status === EmployeeStatus.SUBMITTED ||
    emp.status === EmployeeStatus.L1_REVIEW
  );
}

export function isL1ReversedFromL2(emp: {
  status: string;
  l2Decision: unknown;
}): boolean {
  return (
    decisionAction(emp.l2Decision) === "RETURN_TO_L1" &&
    (emp.status === EmployeeStatus.L1_REVIEW ||
      emp.status === EmployeeStatus.SUBMITTED)
  );
}

export function isL2PendingEmployee(emp: {
  status: string;
  l1Decision: unknown;
  l2Decision: unknown;
  forwardedToAdminAt: unknown;
  forwardedToSupportAt: unknown;
}): boolean {
  return isPendingL2Review({
    status: emp.status as EmployeeStatus,
    l1Decision: asRecord(emp.l1Decision) as { action?: string } | null,
    l2Decision: asRecord(emp.l2Decision) as { action?: string } | null,
    forwardedToAdminAt: emp.forwardedToAdminAt,
    forwardedToSupportAt: emp.forwardedToSupportAt,
  });
}

export function isScanningPendingEmployee(emp: {
  status: string;
  forwardedToAdminAt: unknown;
  temporaryEmployeeId: string | null;
  scanningCompletedAt?: unknown;
  l2Decision: unknown;
}): boolean {
  if (!emp.forwardedToAdminAt) return false;
  if (!emp.temporaryEmployeeId) return false;
  if (emp.scanningCompletedAt) return false;
  const action = decisionAction(emp.l2Decision);
  if (action !== "APPROVE" && action !== "FORWARD") return false;
  return (
    emp.status === EmployeeStatus.APPROVED ||
    emp.status === EmployeeStatus.ID_GENERATED
  );
}

export function isScanningCompletedEmployee(emp: {
  scanningCompletedAt: unknown;
  scanningDecision: unknown;
}): boolean {
  return (
    Boolean(emp.scanningCompletedAt) &&
    decisionAction(emp.scanningDecision) === "APPROVE"
  );
}

export function isAdminRegistrationEmployee(emp: {
  status: string;
  forwardedToAdminAt: unknown;
  temporaryEmployeeId: string | null;
  l2Decision: unknown;
}): boolean {
  if (!emp.forwardedToAdminAt) return false;
  if (!emp.temporaryEmployeeId) return false;
  const action = decisionAction(emp.l2Decision);
  if (action !== "APPROVE" && action !== "FORWARD") return false;
  return [
    EmployeeStatus.APPROVED,
    EmployeeStatus.ID_GENERATED,
    EmployeeStatus.SCANNING_COMPLETED,
    EmployeeStatus.ID_CARD_ISSUED,
  ].includes(emp.status as EmployeeStatus);
}

export function startOfLocalDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isLikelyObjectIdString(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}
