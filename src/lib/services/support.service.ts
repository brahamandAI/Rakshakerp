import { connectDB } from "@/lib/db/connect";
import { Employee } from "@/lib/db/models/Employee";
import { IdCard } from "@/lib/db/models/IdCard";
import { IdCardDownloadLog } from "@/lib/db/models/IdCardDownloadLog";
import { EmployeeDocument } from "@/lib/db/models/EmployeeDocument";
import { EmployeeStatus } from "@/types/enums";
import { ADMIN_REGISTRATIONS_FILTER } from "@/lib/services/approval-queue";
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

function deriveDepartment(postAppliedFor?: string): string {
  if (!postAppliedFor) return "—";
  return postAppliedFor;
}

function deriveBranch(emp: Record<string, unknown>): string {
  const addr = emp.address as { localAddress?: string } | undefined;
  const local = addr?.localAddress ?? "";
  const districtMatch = local.match(/,\s*([^,]+),\s*\d{6}/);
  if (districtMatch?.[1]) return districtMatch[1].trim();
  return "—";
}

function mapEmployee(
  emp: Record<string, unknown>,
  card?: {
    _id: unknown;
    url: string;
    downloadUrl?: string;
    completedAt?: Date;
    cardStatus?: string;
  } | null,
  photoUrl?: string
): IdCardQueueItem {
  const personal = emp.personalDetails as {
    fullName?: string;
    postAppliedFor?: string;
    fatherName?: string;
    fatherOrHusbandName?: string;
    aadhaarNumber?: string;
    panNumber?: string;
  } | undefined;
  const additional = emp.additionalDetails as {
    uanNo?: string;
    esicNumber?: string;
    accountNumber?: string;
  } | undefined;
  const searchablePersonal = pickSearchablePersonal(personal);
  const searchableAdditional = pickSearchableAdditional(additional);

  return toClientProps({
    _id: String(emp._id),
    applicationRef: String(emp.applicationRef),
    employeeIdCode: String(emp.employeeId ?? emp.temporaryEmployeeId ?? ""),
    employeeId: emp.employeeId as string | undefined,
    temporaryEmployeeId: emp.temporaryEmployeeId as string | undefined,
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
    department: (card as { department?: string } | undefined)?.department,
    branch: (card as { branch?: string } | undefined)?.branch,
    photoUrl,
    status: emp.status as EmployeeStatus,
    cardStatus: card?.cardStatus,
    forwardedToSupportAt: emp.forwardedToSupportAt
      ? new Date(emp.forwardedToSupportAt as Date).toISOString()
      : undefined,
    hasDraftCard: !!card && !card.completedAt,
    idCardUrl: card?.downloadUrl ?? card?.url,
    idCardId: card ? String(card._id) : undefined,
    completedAt: card?.completedAt
      ? new Date(card.completedAt).toISOString()
      : undefined,
  });
}

async function enrichQueueItems(
  employees: Record<string, unknown>[]
): Promise<IdCardQueueItem[]> {
  const ids = employees.map((e) => e._id);
  const [cards, photos] = await Promise.all([
    IdCard.find({
      employeeId: { $in: ids },
      status: "ACTIVE",
    }).lean(),
    EmployeeDocument.find({
      employeeId: { $in: ids },
      documentType: DocumentType.PHOTO,
      isActive: true,
    }).lean(),
  ]);

  const cardMap = new Map(cards.map((c) => [String(c.employeeId), c]));
  const photoMap = new Map(photos.map((p) => [String(p.employeeId), p.url]));

  return employees.map((emp) => {
    const card = cardMap.get(String(emp._id));
    const photoUrl = photoMap.get(String(emp._id));
    const personal = emp.personalDetails as { postAppliedFor?: string } | undefined;
    const item = mapEmployee(emp, card, photoUrl);
    item.department =
      card?.department ?? deriveDepartment(personal?.postAppliedFor);
    item.branch = card?.branch ?? deriveBranch(emp);
    item.designation = card?.designation ?? personal?.postAppliedFor ?? item.designation;
    return item;
  });
}

export async function getSupportStats() {
  await connectDB();

  const [pending, completed] = await Promise.all([
    Employee.countDocuments(ADMIN_REGISTRATIONS_FILTER),
    Employee.countDocuments({ status: EmployeeStatus.ID_CARD_ISSUED }),
  ]);

  return { pending, completed, generatedToday: pending, downloadsToday: 0 };
}

export async function getPendingIdCards(): Promise<IdCardQueueItem[]> {
  await connectDB();

  const employees = await Employee.find(ADMIN_REGISTRATIONS_FILTER)
    .sort({ forwardedToAdminAt: -1 })
    .limit(50)
    .lean();

  return enrichQueueItems(employees as Record<string, unknown>[]);
}

export async function getCompletedIdCards(): Promise<IdCardQueueItem[]> {
  await connectDB();

  const employees = await Employee.find({
    status: EmployeeStatus.ID_CARD_ISSUED,
  })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return enrichQueueItems(employees as Record<string, unknown>[]);
}

export async function getRecentPendingIdCards(limit = 5): Promise<IdCardQueueItem[]> {
  await connectDB();

  const employees = await Employee.find(ADMIN_REGISTRATIONS_FILTER)
    .sort({ forwardedToAdminAt: -1 })
    .limit(limit)
    .lean();

  return enrichQueueItems(employees as Record<string, unknown>[]);
}

export interface DownloadHistoryItem {
  _id: string;
  employeeIdCode: string;
  employeeName: string;
  action: string;
  performedByName?: string;
  createdAt: string;
}

export async function getDownloadHistory(limit = 50): Promise<DownloadHistoryItem[]> {
  await connectDB();

  const logs = await IdCardDownloadLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("performedBy", "name")
    .lean();

  return logs.map((log) =>
    toClientProps({
      _id: String(log._id),
      employeeIdCode: log.employeeIdCode,
      employeeName: log.employeeName,
      action: log.action,
      performedByName: (log.performedBy as { name?: string } | undefined)?.name,
      createdAt: log.createdAt.toISOString(),
    })
  );
}

export async function getEligibleForGeneration(): Promise<IdCardQueueItem[]> {
  return getPendingIdCards();
}
