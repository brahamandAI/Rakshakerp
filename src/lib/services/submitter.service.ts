import { prisma } from "@/lib/db/prisma";
import { EmployeeStatus } from "@/types/enums";
import {
  asRecord,
  isAdminRegistrationEmployee,
} from "@/lib/services/approval-queue";
import { getRegistrationStatusLabel } from "@/features/application-status/constants";
import { toClientProps } from "@/lib/serialize/client-props";
import {
  pickSearchableAdditional,
  pickSearchablePersonal,
} from "@/lib/ui/registration-search";

export interface SubmitterRegistrationItem {
  _id: string;
  applicationRef: string;
  fullName: string;
  email: string;
  phone: string;
  postAppliedFor?: string;
  status: EmployeeStatus;
  statusLabel: string;
  submittedAt?: string;
  temporaryEmployeeId?: string;
  employeeId?: string;
  fatherName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  uanNo?: string;
  esicNumber?: string;
  accountNumber?: string;
  forwardedToAdminAt?: string;
  rejectionComment?: string;
  submittedByName?: string;
  submittedByEmail?: string;
}

type SubmitterRow = {
  id: string;
  applicationRef: string;
  email: string;
  phone: string;
  status: string;
  submittedAt: Date | null;
  temporaryEmployeeId: string | null;
  employeeId: string | null;
  personalDetails: unknown;
  additionalDetails: unknown;
  forwardedToAdminAt: Date | null;
  rejectionReason: string | null;
  correctionNotes: string | null;
  submittedBy: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  l2Decision: unknown;
  updatedAt: Date;
};

const listSelect = {
  id: true,
  applicationRef: true,
  email: true,
  phone: true,
  status: true,
  submittedAt: true,
  temporaryEmployeeId: true,
  employeeId: true,
  personalDetails: true,
  additionalDetails: true,
  forwardedToAdminAt: true,
  rejectionReason: true,
  correctionNotes: true,
  submittedBy: true,
  submittedByName: true,
  submittedByEmail: true,
  l2Decision: true,
  updatedAt: true,
} as const;

const ADMIN_REGISTRATION_STATUSES = [
  EmployeeStatus.APPROVED,
  EmployeeStatus.ID_GENERATED,
  EmployeeStatus.SCANNING_COMPLETED,
  EmployeeStatus.ID_CARD_ISSUED,
] as const;

async function loadSubmitterUsers(
  rows: SubmitterRow[]
): Promise<Map<string, { name: string; email: string }>> {
  const ids = [
    ...new Set(rows.map((r) => r.submittedBy).filter(Boolean) as string[]),
  ];
  if (ids.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  return new Map(users.map((u) => [u.id, { name: u.name, email: u.email }]));
}

function mapRegistration(
  emp: SubmitterRow,
  users: Map<string, { name: string; email: string }>
): SubmitterRegistrationItem {
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
  const temporaryEmployeeId = emp.temporaryEmployeeId ?? undefined;
  const status = emp.status as EmployeeStatus;
  const rejectionComment =
    emp.rejectionReason ?? emp.correctionNotes ?? undefined;

  const statusLabel = temporaryEmployeeId
    ? `L2 Approved - Temporary Employee ID: ${temporaryEmployeeId}`
    : status === EmployeeStatus.L1_RETURNED
      ? "Reversed by L1 — Update & Resubmit"
      : status === EmployeeStatus.L2_RETURNED
        ? "Reversed by L2 — Update & Resubmit"
        : status === EmployeeStatus.L2_REVIEW
          ? "Pending L2 Approval"
          : status === EmployeeStatus.ID_GENERATED
            ? "Temporary Employee ID Generated"
            : getRegistrationStatusLabel(status);

  const submitterUser = emp.submittedBy ? users.get(emp.submittedBy) : undefined;

  return toClientProps({
    _id: emp.id,
    applicationRef: emp.applicationRef,
    fullName: personal?.fullName ?? "Unknown",
    email: emp.email,
    phone: emp.phone,
    postAppliedFor: personal?.postAppliedFor,
    status,
    statusLabel,
    submittedAt: emp.submittedAt
      ? new Date(emp.submittedAt).toISOString()
      : undefined,
    temporaryEmployeeId,
    employeeId: emp.employeeId ?? undefined,
    fatherName: searchablePersonal.fatherName || undefined,
    aadhaarNumber: searchablePersonal.aadhaarNumber || undefined,
    panNumber: searchablePersonal.panNumber || undefined,
    uanNo: searchableAdditional.uanNo || undefined,
    esicNumber: searchableAdditional.esicNumber || undefined,
    accountNumber: searchableAdditional.accountNumber || undefined,
    forwardedToAdminAt: emp.forwardedToAdminAt
      ? new Date(emp.forwardedToAdminAt).toISOString()
      : undefined,
    rejectionComment,
    submittedByName: submitterUser?.name || emp.submittedByName || undefined,
    submittedByEmail: submitterUser?.email || emp.submittedByEmail || undefined,
  });
}

async function mapRows(rows: SubmitterRow[]): Promise<SubmitterRegistrationItem[]> {
  const users = await loadSubmitterUsers(rows);
  return rows.map((r) => mapRegistration(r, users));
}

export async function getSubmitterRegistrations(
  submitterId: string
): Promise<SubmitterRegistrationItem[]> {
  const items = await prisma.employee.findMany({
    where: { submittedBy: submitterId },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return mapRows(items);
}

export async function getSubmitterRegistrationDetail(
  submitterId: string,
  employeeId: string
) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      submittedBy: submitterId,
    },
    select: { id: true },
  });

  if (!employee) return null;

  const { getEmployeeDetailForReview } = await import(
    "@/lib/services/approval.service"
  );
  return getEmployeeDetailForReview(employeeId);
}

export async function getSubmitterReversedRegistrations(
  submitterId: string
): Promise<SubmitterRegistrationItem[]> {
  const items = await prisma.employee.findMany({
    where: {
      submittedBy: submitterId,
      status: {
        in: [EmployeeStatus.L1_RETURNED, EmployeeStatus.L2_RETURNED],
      },
    },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return mapRows(items);
}

export async function getSubmitterStats(submitterId: string) {
  const [total, pendingL1, pendingL2, approved, reversed] = await Promise.all([
    prisma.employee.count({ where: { submittedBy: submitterId } }),
    prisma.employee.count({
      where: {
        submittedBy: submitterId,
        status: {
          in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW],
        },
      },
    }),
    prisma.employee.count({
      where: {
        submittedBy: submitterId,
        status: EmployeeStatus.L2_REVIEW,
      },
    }),
    prisma.employee.count({
      where: {
        submittedBy: submitterId,
        temporaryEmployeeId: { not: null },
      },
    }),
    prisma.employee.count({
      where: {
        submittedBy: submitterId,
        status: {
          in: [EmployeeStatus.L1_RETURNED, EmployeeStatus.L2_RETURNED],
        },
      },
    }),
  ]);

  return { total, pendingL1, pendingL2, approved, reversed };
}

export async function getAdminCompletedRegistrations(): Promise<
  SubmitterRegistrationItem[]
> {
  const candidates = await prisma.employee.findMany({
    where: {
      forwardedToAdminAt: { not: null },
      temporaryEmployeeId: { not: null },
      status: { in: [...ADMIN_REGISTRATION_STATUSES] },
    },
    select: listSelect,
    orderBy: { forwardedToAdminAt: "desc" },
    take: 300,
  });

  const items = candidates
    .filter(isAdminRegistrationEmployee)
    .slice(0, 100);

  return mapRows(items);
}

export async function getAdminRegistrationStats() {
  const [adminCandidates, pendingL1, pendingL2] = await Promise.all([
    prisma.employee.findMany({
      where: {
        forwardedToAdminAt: { not: null },
        temporaryEmployeeId: { not: null },
        status: { in: [...ADMIN_REGISTRATION_STATUSES] },
      },
      select: {
        status: true,
        forwardedToAdminAt: true,
        temporaryEmployeeId: true,
        l2Decision: true,
      },
    }),
    prisma.employee.count({
      where: {
        status: {
          in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW],
        },
      },
    }),
    prisma.employee.count({ where: { status: EmployeeStatus.L2_REVIEW } }),
  ]);

  const completed = adminCandidates.filter(isAdminRegistrationEmployee).length;
  return { completed, pendingL1, pendingL2 };
}

export async function getAdminQueueRegistrations(
  statuses: EmployeeStatus[]
): Promise<SubmitterRegistrationItem[]> {
  const items = await prisma.employee.findMany({
    where: { status: { in: statuses } },
    select: listSelect,
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return mapRows(items);
}
