import { prisma } from "@/lib/db/prisma";
import { EmployeeStatus } from "@/types/enums";
import {
  ApplicationListItem,
  listSelect,
  mapRows,
  type EmployeeListRow,
} from "@/lib/services/l1.service";
import {
  decidedByMatches,
  decisionAction,
  isL2PendingEmployee,
} from "@/lib/services/approval-queue";

function l2ReversedMatch(emp: EmployeeListRow, l2UserId: string): boolean {
  if (
    emp.status === EmployeeStatus.L2_RETURNED &&
    decidedByMatches(emp.l2Decision, l2UserId)
  ) {
    return true;
  }
  if (
    emp.status === EmployeeStatus.REJECTED &&
    decidedByMatches(emp.l2Decision, l2UserId)
  ) {
    return true;
  }
  if (
    decisionAction(emp.l2Decision) === "RETURN_TO_L1" &&
    decidedByMatches(emp.l2Decision, l2UserId)
  ) {
    return true;
  }
  return false;
}

export async function getL2Stats(l2UserId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const candidates = await prisma.employee.findMany({
    where: { status: { not: EmployeeStatus.DRAFT } },
    select: {
      id: true,
      status: true,
      l1Decision: true,
      l2Decision: true,
      forwardedToAdminAt: true,
      forwardedToSupportAt: true,
    },
  });

  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let forwarded = 0;
  let approvedThisMonth = 0;

  for (const emp of candidates) {
    if (isL2PendingEmployee(emp)) pending += 1;

    const l2Action = decisionAction(emp.l2Decision);
    const isApproveOrForward =
      (l2Action === "APPROVE" || l2Action === "FORWARD") &&
      decidedByMatches(emp.l2Decision, l2UserId);

    if (isApproveOrForward) {
      approved += 1;
      const decidedAt = (emp.l2Decision as { decidedAt?: string | Date } | null)
        ?.decidedAt;
      if (decidedAt && new Date(decidedAt) >= startOfMonth) {
        approvedThisMonth += 1;
      }
    }

    if (l2ReversedMatch(emp as EmployeeListRow, l2UserId)) rejected += 1;

    if (emp.forwardedToAdminAt && decidedByMatches(emp.l2Decision, l2UserId)) {
      forwarded += 1;
    }
  }

  return { pending, approved, rejected, forwarded, approvedThisMonth };
}

export async function getL2PendingApplications(): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      status: EmployeeStatus.L2_REVIEW,
      forwardedToAdminAt: null,
      forwardedToSupportAt: null,
    },
    select: listSelect,
    orderBy: { l1ApprovedAt: "desc" },
    take: 200,
  });

  const matched = candidates.filter(isL2PendingEmployee).slice(0, 50);
  return mapRows(matched);
}

export async function getL2ApprovedApplications(
  l2UserId: string
): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: { approvedAt: { not: null } },
    select: listSelect,
    orderBy: { approvedAt: "desc" },
    take: 300,
  });

  const matched = candidates
    .filter((e) => {
      const action = decisionAction(e.l2Decision);
      return (
        (action === "APPROVE" || action === "FORWARD") &&
        decidedByMatches(e.l2Decision, l2UserId)
      );
    })
    .slice(0, 50);

  return mapRows(matched);
}

export async function getL2RejectedApplications(
  l2UserId: string
): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      OR: [
        { status: { in: [EmployeeStatus.L2_RETURNED, EmployeeStatus.REJECTED] } },
        { status: { in: [EmployeeStatus.L1_REVIEW, EmployeeStatus.SUBMITTED] } },
      ],
    },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: 400,
  });

  const matched = candidates
    .filter((e) => l2ReversedMatch(e, l2UserId))
    .slice(0, 50);

  return mapRows(matched);
}

export async function getL2AllApprovedRegistrations(): Promise<ApplicationListItem[]> {
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
    orderBy: [{ approvedAt: "desc" }, { forwardedToAdminAt: "desc" }],
    take: 400,
  });

  const matched = candidates
    .filter((e) => {
      const action = decisionAction(e.l2Decision);
      return action === "APPROVE" || action === "FORWARD";
    })
    .slice(0, 200);

  return mapRows(matched);
}

export async function getL2RecentPending(limit = 5): Promise<ApplicationListItem[]> {
  const candidates = await prisma.employee.findMany({
    where: {
      status: EmployeeStatus.L2_REVIEW,
      forwardedToAdminAt: null,
      forwardedToSupportAt: null,
    },
    select: listSelect,
    orderBy: { l1ApprovedAt: "desc" },
    take: limit * 4,
  });

  return mapRows(candidates.filter(isL2PendingEmployee).slice(0, limit));
}
