import { prisma } from "@/lib/db/prisma";
import { EmployeeStatus } from "@/types/enums";
import { toClientProps } from "@/lib/serialize/client-props";
import {
  pickSearchableAdditional,
  pickSearchablePersonal,
} from "@/lib/ui/registration-search";
import {
  asRecord,
  decidedByMatches,
  decisionAction,
  decisionDecidedById,
  isL1PendingEmployee,
  isL1ReversedFromL2,
  startOfLocalDay,
} from "@/lib/services/approval-queue";

export interface ApplicationListItem {
  _id: string;
  applicationRef: string;
  fullName: string;
  email: string;
  phone: string;
  postAppliedFor?: string;
  status: EmployeeStatus;
  submittedAt?: string;
  employeeId?: string;
  temporaryEmployeeId?: string;
  fatherName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  uanNo?: string;
  esicNumber?: string;
  accountNumber?: string;
  l1ApprovedAt?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  l1ApprovedByName?: string;
  /** Note L2 left when sending the application back to L1 */
  l2ReverseNote?: string;
  l2ReversedAt?: string;
  l2ReversedByName?: string;
}

type EmployeeListRow = {
  id: string;
  applicationRef: string;
  email: string;
  phone: string;
  status: string;
  submittedAt: Date | null;
  employeeId: string | null;
  temporaryEmployeeId: string | null;
  personalDetails: unknown;
  additionalDetails: unknown;
  submittedBy: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  l1ApprovedAt: Date | null;
  l1Decision: unknown;
  l2Decision: unknown;
  correctionNotes: string | null;
  approvedAt: Date | null;
  forwardedToAdminAt: Date | null;
  forwardedToSupportAt: Date | null;
  updatedAt: Date;
  scanningCompletedAt?: Date | null;
  scanningDecision?: unknown;
};

const listSelect = {
  id: true,
  applicationRef: true,
  email: true,
  phone: true,
  status: true,
  submittedAt: true,
  employeeId: true,
  temporaryEmployeeId: true,
  personalDetails: true,
  additionalDetails: true,
  submittedBy: true,
  submittedByName: true,
  submittedByEmail: true,
  l1ApprovedAt: true,
  l1Decision: true,
  l2Decision: true,
  correctionNotes: true,
  approvedAt: true,
  forwardedToAdminAt: true,
  forwardedToSupportAt: true,
  updatedAt: true,
  scanningCompletedAt: true,
  scanningDecision: true,
} as const;

async function loadUserNameMap(ids: string[]): Promise<Map<string, { name: string; email: string }>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, email: true },
  });
  return new Map(users.map((u) => [u.id, { name: u.name, email: u.email }]));
}

function collectUserIds(rows: EmployeeListRow[]): string[] {
  const ids: string[] = [];
  for (const emp of rows) {
    if (emp.submittedBy) ids.push(emp.submittedBy);
    const l1By = decisionDecidedById(emp.l1Decision);
    if (l1By) ids.push(l1By);
    const l2By = decisionDecidedById(emp.l2Decision);
    if (l2By) ids.push(l2By);
  }
  return ids;
}

function mapEmployee(
  emp: EmployeeListRow,
  users: Map<string, { name: string; email: string }>
): ApplicationListItem {
  const personal = asRecord(emp.personalDetails) as {
    fullName?: string;
    postAppliedFor?: string;
    fatherName?: string;
    fatherOrHusbandName?: string;
    aadhaarNumber?: string;
    panNumber?: string;
  } | null;
  const additional = asRecord(emp.additionalDetails) as {
    uanNo?: string;
    esicNumber?: string;
    accountNumber?: string;
  } | null;
  const searchablePersonal = pickSearchablePersonal(personal ?? undefined);
  const searchableAdditional = pickSearchableAdditional(additional ?? undefined);

  const submitterUser = emp.submittedBy ? users.get(emp.submittedBy) : undefined;
  const l1Decision = asRecord(emp.l1Decision);
  const l2Decision = asRecord(emp.l2Decision);
  const isL2Reversal = decisionAction(emp.l2Decision) === "RETURN_TO_L1";
  const l1DecidedById = decisionDecidedById(emp.l1Decision);
  const l2DecidedById = decisionDecidedById(emp.l2Decision);
  const l1User = l1DecidedById ? users.get(l1DecidedById) : undefined;
  const l2User = l2DecidedById ? users.get(l2DecidedById) : undefined;

  const approvedByName =
    (typeof l1Decision?.approvedByName === "string"
      ? l1Decision.approvedByName
      : undefined) || l1User?.name;

  return toClientProps({
    _id: emp.id,
    applicationRef: emp.applicationRef,
    fullName: personal?.fullName ?? "Unknown",
    email: emp.email,
    phone: emp.phone,
    postAppliedFor: personal?.postAppliedFor,
    status: emp.status as EmployeeStatus,
    submittedAt: emp.submittedAt?.toISOString(),
    employeeId: emp.employeeId ?? undefined,
    temporaryEmployeeId: emp.temporaryEmployeeId ?? undefined,
    fatherName: searchablePersonal.fatherName || undefined,
    aadhaarNumber: searchablePersonal.aadhaarNumber || undefined,
    panNumber: searchablePersonal.panNumber || undefined,
    uanNo: searchableAdditional.uanNo || undefined,
    esicNumber: searchableAdditional.esicNumber || undefined,
    accountNumber: searchableAdditional.accountNumber || undefined,
    l1ApprovedAt: emp.l1ApprovedAt?.toISOString(),
    submittedByName: submitterUser?.name || emp.submittedByName || undefined,
    submittedByEmail: submitterUser?.email || emp.submittedByEmail || undefined,
    l1ApprovedByName: approvedByName,
    l2ReverseNote: isL2Reversal
      ? (typeof l2Decision?.comment === "string"
          ? l2Decision.comment
          : emp.correctionNotes ?? undefined)
      : undefined,
    l2ReversedAt:
      isL2Reversal && l2Decision?.decidedAt
        ? new Date(l2Decision.decidedAt as string | Date).toISOString()
        : undefined,
    l2ReversedByName: isL2Reversal ? l2User?.name : undefined,
  });
}

async function mapRows(rows: EmployeeListRow[]): Promise<ApplicationListItem[]> {
  const users = await loadUserNameMap(collectUserIds(rows));
  return rows.map((r) => mapEmployee(r, users));
}

export async function getL1Stats(l1UserId: string) {
  const candidates = await prisma.employee.findMany({
    where: {
      status: { not: EmployeeStatus.DRAFT },
    },
    select: {
      id: true,
      status: true,
      l1Decision: true,
      l2Decision: true,
    },
  });

  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let returnedToday = 0;
  let reversedFromL2 = 0;
  const dayStart = startOfLocalDay();

  for (const emp of candidates) {
    if (isL1PendingEmployee(emp)) pending += 1;
    if (isL1ReversedFromL2(emp)) reversedFromL2 += 1;

    if (
      decisionAction(emp.l1Decision) === "APPROVE" &&
      decidedByMatches(emp.l1Decision, l1UserId)
    ) {
      approved += 1;
    }

    const isRejectedBucket =
      (emp.status === EmployeeStatus.L1_RETURNED &&
        decidedByMatches(emp.l1Decision, l1UserId)) ||
      (emp.status === EmployeeStatus.L2_RETURNED &&
        decisionAction(emp.l1Decision) === "APPROVE" &&
        decidedByMatches(emp.l1Decision, l1UserId)) ||
      (emp.status === EmployeeStatus.REJECTED &&
        decidedByMatches(emp.l1Decision, l1UserId));
    if (isRejectedBucket) rejected += 1;

    if (
      emp.status === EmployeeStatus.L1_RETURNED &&
      decidedByMatches(emp.l1Decision, l1UserId)
    ) {
      const decidedAt = asRecord(emp.l1Decision)?.decidedAt;
      if (decidedAt && new Date(decidedAt as string | Date) >= dayStart) {
        returnedToday += 1;
      }
    }
  }

  return { pending, approved, rejected, returnedToday, reversedFromL2 };
}

export async function getL1ReversedFromL2Applications(): Promise<
  ApplicationListItem[]
> {
  const candidates = await prisma.employee.findMany({
    where: {
      status: { in: [EmployeeStatus.L1_REVIEW, EmployeeStatus.SUBMITTED] },
    },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const matched = candidates
    .filter(isL1ReversedFromL2)
    .sort((a, b) => {
      const aAt = asRecord(a.l2Decision)?.decidedAt;
      const bAt = asRecord(b.l2Decision)?.decidedAt;
      const aTime = aAt ? new Date(aAt as string | Date).getTime() : 0;
      const bTime = bAt ? new Date(bAt as string | Date).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .slice(0, 50);

  return mapRows(matched);
}

export async function getL1PendingApplications(): Promise<ApplicationListItem[]> {
  const items = await prisma.employee.findMany({
    where: {
      status: { in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW] },
    },
    select: listSelect,
    orderBy: { submittedAt: "desc" },
    take: 50,
  });
  return mapRows(items);
}

export async function getL1ApprovedApplications(
  l1UserId: string
): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: { l1ApprovedAt: { not: null } },
    select: listSelect,
    orderBy: { l1ApprovedAt: "desc" },
    take: 300,
  });

  const matched = candidates
    .filter(
      (e) =>
        decisionAction(e.l1Decision) === "APPROVE" &&
        decidedByMatches(e.l1Decision, l1UserId)
    )
    .slice(0, 50);

  return mapRows(matched);
}

export async function getL1RejectedApplications(
  l1UserId: string
): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      status: {
        in: [
          EmployeeStatus.L1_RETURNED,
          EmployeeStatus.L2_RETURNED,
          EmployeeStatus.REJECTED,
        ],
      },
    },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: 300,
  });

  const matched = candidates
    .filter((e) => {
      if (
        e.status === EmployeeStatus.L1_RETURNED &&
        decidedByMatches(e.l1Decision, l1UserId)
      ) {
        return true;
      }
      if (
        e.status === EmployeeStatus.L2_RETURNED &&
        decisionAction(e.l1Decision) === "APPROVE" &&
        decidedByMatches(e.l1Decision, l1UserId)
      ) {
        return true;
      }
      if (
        e.status === EmployeeStatus.REJECTED &&
        decidedByMatches(e.l1Decision, l1UserId)
      ) {
        return true;
      }
      return false;
    })
    .slice(0, 50);

  return mapRows(matched);
}

export async function getL1AllApprovedRegistrations(): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      status: {
        in: [
          EmployeeStatus.APPROVED,
          EmployeeStatus.ID_GENERATED,
          EmployeeStatus.ID_CARD_ISSUED,
        ],
      },
      temporaryEmployeeId: { not: null },
    },
    select: listSelect,
    orderBy: [{ approvedAt: "desc" }, { l1ApprovedAt: "desc" }],
    take: 400,
  });

  const matched = candidates
    .filter((e) => decisionAction(e.l1Decision) === "APPROVE")
    .slice(0, 200);

  return mapRows(matched);
}

export async function getL1RecentPending(limit = 5): Promise<ApplicationListItem[]> {
  const items = await prisma.employee.findMany({
    where: {
      status: { in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW] },
    },
    select: listSelect,
    orderBy: { submittedAt: "desc" },
    take: limit,
  });
  return mapRows(items);
}

// Re-export helpers used by l2/scanning mappers to avoid duplication
export {
  listSelect,
  mapRows,
  type EmployeeListRow,
  loadUserNameMap,
  collectUserIds,
  mapEmployee,
};
