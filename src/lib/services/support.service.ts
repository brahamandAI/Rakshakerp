import { prisma } from "@/lib/db/prisma";
import { EmployeeStatus } from "@/types/enums";
import {
  asRecord,
  isAdminRegistrationEmployee,
} from "@/lib/services/approval-queue";
import { DocumentType } from "@/features/onboarding/constants";
import { toClientProps } from "@/lib/serialize/client-props";
import {
  pickSearchableAdditional,
  pickSearchablePersonal,
} from "@/lib/ui/registration-search";

export interface IdCardQueueItem {
  _id: string;
  applicationRef: string;
  employeeIdCode: string;
  fullName: string;
  designation?: string;
  department?: string;
  branch?: string;
  postAppliedFor?: string;
  photoUrl?: string;
  status: EmployeeStatus;
  cardStatus?: string;
  forwardedToSupportAt?: string;
  hasDraftCard: boolean;
  idCardUrl?: string;
  idCardId?: string;
  completedAt?: string;
  phone?: string;
  fatherName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  uanNo?: string;
  esicNumber?: string;
  accountNumber?: string;
  temporaryEmployeeId?: string;
  employeeId?: string;
}

type SupportEmployeeRow = {
  id: string;
  applicationRef: string;
  email: string;
  phone: string;
  status: string;
  employeeId: string | null;
  temporaryEmployeeId: string | null;
  personalDetails: unknown;
  additionalDetails: unknown;
  address: unknown;
  forwardedToAdminAt: Date | null;
  forwardedToSupportAt: Date | null;
  l2Decision: unknown;
  updatedAt: Date;
};

const supportListSelect = {
  id: true,
  applicationRef: true,
  email: true,
  phone: true,
  status: true,
  employeeId: true,
  temporaryEmployeeId: true,
  personalDetails: true,
  additionalDetails: true,
  address: true,
  forwardedToAdminAt: true,
  forwardedToSupportAt: true,
  l2Decision: true,
  updatedAt: true,
} as const;

const ADMIN_REGISTRATION_STATUSES = [
  EmployeeStatus.APPROVED,
  EmployeeStatus.ID_GENERATED,
  EmployeeStatus.SCANNING_COMPLETED,
  EmployeeStatus.ID_CARD_ISSUED,
] as const;

function deriveDepartment(postAppliedFor?: string): string {
  if (!postAppliedFor) return "—";
  return postAppliedFor;
}

function deriveBranch(emp: { address: unknown }): string {
  const addr = asRecord(emp.address) as { localAddress?: string } | null;
  const local = addr?.localAddress ?? "";
  const districtMatch = local.match(/,\s*([^,]+),\s*\d{6}/);
  if (districtMatch?.[1]) return districtMatch[1].trim();
  return "—";
}

function mapEmployee(
  emp: SupportEmployeeRow,
  card?: {
    id: string;
    url: string;
    downloadUrl: string | null;
    completedAt: Date | null;
    cardStatus: string | null;
    department: string | null;
    branch: string | null;
    designation: string | null;
  } | null,
  photoUrl?: string
): IdCardQueueItem {
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

  return toClientProps({
    _id: emp.id,
    applicationRef: emp.applicationRef,
    employeeIdCode: String(emp.employeeId ?? emp.temporaryEmployeeId ?? ""),
    employeeId: emp.employeeId ?? undefined,
    temporaryEmployeeId: emp.temporaryEmployeeId ?? undefined,
    fullName: personal?.fullName ?? "Unknown",
    phone: String(emp.phone ?? ""),
    fatherName: searchablePersonal.fatherName || undefined,
    aadhaarNumber: searchablePersonal.aadhaarNumber || undefined,
    panNumber: searchablePersonal.panNumber || undefined,
    uanNo: searchableAdditional.uanNo || undefined,
    esicNumber: searchableAdditional.esicNumber || undefined,
    accountNumber: searchableAdditional.accountNumber || undefined,
    designation: personal?.postAppliedFor,
    postAppliedFor: personal?.postAppliedFor,
    department: card?.department ?? undefined,
    branch: card?.branch ?? undefined,
    photoUrl,
    status: emp.status as EmployeeStatus,
    cardStatus: card?.cardStatus ?? undefined,
    forwardedToSupportAt: emp.forwardedToSupportAt
      ? new Date(emp.forwardedToSupportAt).toISOString()
      : undefined,
    hasDraftCard: !!card && !card.completedAt,
    idCardUrl: card?.downloadUrl ?? card?.url,
    idCardId: card ? card.id : undefined,
    completedAt: card?.completedAt
      ? new Date(card.completedAt).toISOString()
      : undefined,
  });
}

async function enrichQueueItems(
  employees: SupportEmployeeRow[]
): Promise<IdCardQueueItem[]> {
  const ids = employees.map((e) => e.id);
  const [cards, photos] = await Promise.all([
    prisma.idCard.findMany({
      where: {
        employeeId: { in: ids },
        status: "ACTIVE",
      },
      select: {
        id: true,
        employeeId: true,
        url: true,
        downloadUrl: true,
        completedAt: true,
        cardStatus: true,
        department: true,
        branch: true,
        designation: true,
      },
    }),
    prisma.employeeDocument.findMany({
      where: {
        employeeId: { in: ids },
        documentType: DocumentType.PHOTO,
        isActive: true,
      },
      select: { employeeId: true, url: true },
    }),
  ]);

  const cardMap = new Map(cards.map((c) => [c.employeeId, c]));
  const photoMap = new Map(photos.map((p) => [p.employeeId, p.url]));

  return employees.map((emp) => {
    const card = cardMap.get(emp.id) ?? null;
    const photoUrl = photoMap.get(emp.id);
    const personal = asRecord(emp.personalDetails) as {
      postAppliedFor?: string;
    } | null;
    const item = mapEmployee(emp, card, photoUrl);
    item.department =
      card?.department ?? deriveDepartment(personal?.postAppliedFor);
    item.branch = card?.branch ?? deriveBranch(emp);
    item.designation =
      card?.designation ?? personal?.postAppliedFor ?? item.designation;
    return item;
  });
}

async function fetchAdminRegistrationEmployees(limit: number) {
  const candidates = await prisma.employee.findMany({
    where: {
      forwardedToAdminAt: { not: null },
      temporaryEmployeeId: { not: null },
      status: { in: [...ADMIN_REGISTRATION_STATUSES] },
    },
    select: supportListSelect,
    orderBy: { forwardedToAdminAt: "desc" },
    take: Math.max(limit * 3, limit),
  });

  return candidates.filter(isAdminRegistrationEmployee).slice(0, limit);
}

export async function getSupportStats() {
  const [adminCandidates, completed] = await Promise.all([
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
      where: { status: EmployeeStatus.ID_CARD_ISSUED },
    }),
  ]);

  const pending = adminCandidates.filter(isAdminRegistrationEmployee).length;

  return { pending, completed, generatedToday: pending, downloadsToday: 0 };
}

export async function getPendingIdCards(): Promise<IdCardQueueItem[]> {
  const employees = await fetchAdminRegistrationEmployees(50);
  return enrichQueueItems(employees);
}

export async function getCompletedIdCards(): Promise<IdCardQueueItem[]> {
  const employees = await prisma.employee.findMany({
    where: { status: EmployeeStatus.ID_CARD_ISSUED },
    select: supportListSelect,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return enrichQueueItems(employees);
}

export async function getRecentPendingIdCards(
  limit = 5
): Promise<IdCardQueueItem[]> {
  const employees = await fetchAdminRegistrationEmployees(limit);
  return enrichQueueItems(employees);
}

export interface DownloadHistoryItem {
  _id: string;
  employeeIdCode: string;
  employeeName: string;
  action: string;
  performedByName?: string;
  createdAt: string;
}

export async function getDownloadHistory(
  limit = 50
): Promise<DownloadHistoryItem[]> {
  const logs = await prisma.idCardDownloadLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      employeeIdCode: true,
      employeeName: true,
      action: true,
      createdAt: true,
      performedByUser: { select: { name: true } },
    },
  });

  return logs.map((log) =>
    toClientProps({
      _id: log.id,
      employeeIdCode: log.employeeIdCode,
      employeeName: log.employeeName,
      action: log.action,
      performedByName: log.performedByUser?.name,
      createdAt: log.createdAt.toISOString(),
    })
  );
}

export async function getEligibleForGeneration(): Promise<IdCardQueueItem[]> {
  return getPendingIdCards();
}
