import { prisma } from "@/lib/db/prisma";
import { newObjectIdString } from "@/lib/db/ids";
import { EmployeeStatus, UserRole } from "@/types/enums";
import { DocumentType } from "@/features/onboarding/constants";
import { generateIdCardPdf } from "@/lib/services/id-card-pdf.service";
import { uploadIdCardToCloudinary } from "@/lib/cloudinary/upload";
import {
  buildEmployeeQrPayload,
  generateQrCodeDataUrl,
  serializeQrPayload,
} from "@/lib/services/qr-code.service";
import {
  dispatchIdCardGenerated,
  employeeNotifyContext,
} from "@/lib/services/notification-dispatch.service";
import { toClientProps } from "@/lib/serialize/client-props";
import { asRecord } from "@/lib/services/approval-queue";

export class IdCardError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "IdCardError";
  }
}

export interface IdCardPreviewData {
  employeeId: string;
  applicationRef: string;
  employeeIdCode: string;
  fullName: string;
  designation?: string;
  department?: string;
  branch?: string;
  postAppliedFor?: string;
  phone: string;
  email: string;
  photoUrl?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  address?: string;
  issueDate?: string;
  expiryDate?: string;
  qrCodeDataUrl?: string;
  status: EmployeeStatus;
  hasActiveIdCard: boolean;
  idCardUrl?: string;
  idCardId?: string;
  cardStatus?: string;
  completedAt?: string;
}

export interface EmployeeIdCardData {
  employeeId: string;
  applicationRef: string;
  employeeIdCode: string;
  fullName: string;
  designation?: string;
  department?: string;
  branch?: string;
  postAppliedFor?: string;
  phone: string;
  email: string;
  photoUrl?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  address?: string;
  status: EmployeeStatus;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

async function logAction(params: {
  idCardId?: string;
  employeeId: string;
  employeeIdCode: string;
  employeeName: string;
  action: "PREVIEW" | "DOWNLOAD" | "GENERATE" | "COMPLETE" | "PRINT";
  performedBy: string;
  performedByRole: string;
}) {
  // User FK is required — skip logging if performer missing (should not happen)
  const performer = await prisma.user.findUnique({
    where: { id: params.performedBy },
    select: { id: true },
  });
  if (!performer) return;

  let idCardId: string | null = params.idCardId ?? null;
  if (idCardId) {
    const card = await prisma.idCard.findUnique({
      where: { id: idCardId },
      select: { id: true },
    });
    if (!card) idCardId = null;
  }

  await prisma.idCardDownloadLog.create({
    data: {
      id: newObjectIdString(),
      idCardId,
      employeeId: params.employeeId,
      employeeIdCode: params.employeeIdCode,
      employeeName: params.employeeName,
      action: params.action,
      performedBy: performer.id,
      performedByRole: params.performedByRole,
      createdAt: new Date(),
    },
  });
}

function extractPersonalDetails(employee: { personalDetails?: unknown }) {
  const personal = asRecord(employee.personalDetails) as {
    fullName?: string;
    postAppliedFor?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
  } | null;

  return {
    fullName: personal?.fullName ?? "Unknown",
    postAppliedFor: personal?.postAppliedFor,
    bloodGroup: personal?.bloodGroup,
    dateOfBirth: personal?.dateOfBirth,
  };
}

function extractAddress(employee: { address?: unknown }) {
  const addr = asRecord(employee.address) as {
    localAddress?: string;
    permanentAddress?: string;
    present?: Record<string, string>;
    permanent?: Record<string, string>;
  } | null;

  if (addr?.localAddress) return addr.localAddress;
  if (addr?.permanentAddress) return addr.permanentAddress;

  const present = addr?.present;
  if (present) {
    return [
      present.houseNo,
      present.street,
      present.villageOrCity,
      present.district,
      present.state,
      present.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return undefined;
}

function deriveDepartment(postAppliedFor?: string): string {
  if (!postAppliedFor) return "—";
  return postAppliedFor;
}

function deriveBranch(employee: { address?: unknown }): string {
  const addr = asRecord(employee.address) as { localAddress?: string } | null;
  const local = addr?.localAddress ?? "";
  const districtMatch = local.match(/,\s*([^,]+),\s*\d{6}/);
  if (districtMatch?.[1]) return districtMatch[1].trim();
  return "—";
}

/** Fetch all employee data required for ID card generation. */
export async function fetchEmployeeDataForIdCard(
  employeeId: string
): Promise<EmployeeIdCardData | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      applicationRef: true,
      employeeId: true,
      phone: true,
      email: true,
      status: true,
      personalDetails: true,
      address: true,
    },
  });
  if (!employee || !employee.employeeId) return null;

  const photo = await prisma.employeeDocument.findFirst({
    where: {
      employeeId,
      documentType: DocumentType.PHOTO,
      isActive: true,
    },
    select: { url: true },
  });

  const personal = extractPersonalDetails(employee);
  const designation = personal.postAppliedFor;
  const department = deriveDepartment(designation);
  const branch = deriveBranch(employee);

  return {
    employeeId: employee.id,
    applicationRef: employee.applicationRef,
    employeeIdCode: employee.employeeId,
    fullName: personal.fullName,
    designation,
    department,
    branch,
    postAppliedFor: personal.postAppliedFor,
    phone: employee.phone,
    email: employee.email,
    photoUrl: photo?.url,
    bloodGroup: personal.bloodGroup,
    dateOfBirth: personal.dateOfBirth,
    address: extractAddress(employee),
    status: employee.status as EmployeeStatus,
  };
}

async function buildQrDataUrl(
  data: EmployeeIdCardData,
  issueDate: Date
): Promise<string> {
  const payload = buildEmployeeQrPayload({
    employeeIdCode: data.employeeIdCode,
    fullName: data.fullName,
    designation: data.designation,
    department: data.department,
    branch: data.branch,
    bloodGroup: data.bloodGroup,
    issueDate: issueDate.toISOString(),
    status: "ACTIVE",
  });
  return generateQrCodeDataUrl(serializeQrPayload(payload), 160);
}

async function findActiveIdCard(employeeId: string) {
  return prisma.idCard.findFirst({
    where: { employeeId, status: "ACTIVE" },
  });
}

export async function getIdCardPreviewData(
  employeeId: string
): Promise<IdCardPreviewData | null> {
  const data = await fetchEmployeeDataForIdCard(employeeId);
  if (!data) return null;

  const activeCard = await findActiveIdCard(employeeId);

  const issueDate = activeCard?.issueDate ?? new Date();
  const expiryDate = activeCard?.expiryDate ?? addYears(issueDate, 2);
  const qrCodeDataUrl = await buildQrDataUrl(data, issueDate);

  return toClientProps({
    ...data,
    issueDate: issueDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    qrCodeDataUrl,
    hasActiveIdCard: !!activeCard,
    idCardUrl: activeCard?.downloadUrl ?? activeCard?.url,
    idCardId: activeCard ? activeCard.id : undefined,
    cardStatus: activeCard?.cardStatus ?? undefined,
    completedAt: activeCard?.completedAt?.toISOString(),
  });
}

export async function recordIdCardPreview(
  employeeId: string,
  supportUserId: string
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { employeeId: true, personalDetails: true },
  });
  if (!employee?.employeeId) {
    throw new IdCardError("Employee not found or missing ID", "NOT_FOUND");
  }

  const { fullName } = extractPersonalDetails(employee);
  const activeCard = await findActiveIdCard(employeeId);

  await logAction({
    idCardId: activeCard?.id,
    employeeId,
    employeeIdCode: employee.employeeId,
    employeeName: fullName,
    action: "PREVIEW",
    performedBy: supportUserId,
    performedByRole: UserRole.SUPPORT,
  });
}

export async function generateIdCardForEmployee(
  employeeId: string,
  supportUserId: string
): Promise<{ idCardId: string; url: string }> {
  const data = await fetchEmployeeDataForIdCard(employeeId);
  if (!data) {
    throw new IdCardError("Employee not found or missing employee ID", "NOT_FOUND");
  }

  const allowed = [EmployeeStatus.ID_GENERATED, EmployeeStatus.APPROVED];
  if (
    !allowed.includes(data.status) &&
    data.status !== EmployeeStatus.ID_CARD_ISSUED
  ) {
    throw new IdCardError(
      "Employee is not eligible for ID card generation",
      "INVALID_STATUS"
    );
  }

  const issueDate = new Date();
  const expiryDate = addYears(issueDate, 2);
  const qrCodeDataUrl = await buildQrDataUrl(data, issueDate);

  const pdfBuffer = await generateIdCardPdf({
    fullName: data.fullName,
    employeeIdCode: data.employeeIdCode,
    designation: data.designation,
    department: data.department,
    branch: data.branch,
    bloodGroup: data.bloodGroup,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    photoUrl: data.photoUrl,
    issueDate,
    expiryDate,
    status: "ACTIVE",
  });

  const upload = await uploadIdCardToCloudinary(
    pdfBuffer,
    data.applicationRef,
    data.employeeIdCode
  );

  const generator = await prisma.user.findUnique({
    where: { id: supportUserId },
    select: { id: true },
  });

  /**
   * Prisma IdCard.employeeId is @unique (1 card row per employee).
   * Mongo could supersede + insert; here we upsert the single row in place.
   */
  const existing = await prisma.idCard.findUnique({
    where: { employeeId },
  });

  const cardFields = {
    employeeIdCode: data.employeeIdCode,
    employeeName: data.fullName,
    photoUrl: data.photoUrl ?? null,
    designation: data.designation ?? null,
    department: data.department ?? null,
    branch: data.branch ?? null,
    bloodGroup: data.bloodGroup ?? null,
    dateOfBirth: data.dateOfBirth ?? null,
    address: data.address ?? null,
    qrCodeUrl: qrCodeDataUrl,
    issueDate,
    expiryDate,
    url: upload.url,
    downloadUrl: upload.url,
    format: "PDF",
    status: "ACTIVE",
    cardStatus: "GENERATED",
    generatedBy: generator?.id ?? null,
    completedAt: null,
    completedBy: null,
    generatedAt: issueDate,
    updatedAt: issueDate,
  };

  const idCard = existing
    ? await prisma.idCard.update({
        where: { id: existing.id },
        data: cardFields,
      })
    : await prisma.idCard.create({
        data: {
          id: newObjectIdString(),
          employeeId,
          createdAt: issueDate,
          ...cardFields,
        },
      });

  await logAction({
    idCardId: idCard.id,
    employeeId,
    employeeIdCode: data.employeeIdCode,
    employeeName: data.fullName,
    action: "GENERATE",
    performedBy: supportUserId,
    performedByRole: UserRole.SUPPORT,
  });

  return { idCardId: idCard.id, url: upload.url };
}

export async function recordIdCardDownload(
  idCardId: string,
  supportUserId: string
): Promise<{ url: string; fileName: string }> {
  const idCard = await prisma.idCard.findUnique({ where: { id: idCardId } });
  if (!idCard || idCard.status !== "ACTIVE") {
    throw new IdCardError("ID card not found", "NOT_FOUND");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: idCard.employeeId },
    select: { id: true, personalDetails: true },
  });
  if (!employee) throw new IdCardError("Employee not found", "NOT_FOUND");

  const { fullName } = extractPersonalDetails(employee);

  await logAction({
    idCardId,
    employeeId: employee.id,
    employeeIdCode: idCard.employeeIdCode,
    employeeName: fullName,
    action: "DOWNLOAD",
    performedBy: supportUserId,
    performedByRole: UserRole.SUPPORT,
  });

  const fileName = `ID-Card-${idCard.employeeIdCode.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

  return { url: idCard.downloadUrl ?? idCard.url, fileName };
}

export async function getIdCardDownloadUrl(idCardId: string): Promise<{
  url: string;
  fileName: string;
} | null> {
  const idCard = await prisma.idCard.findUnique({ where: { id: idCardId } });
  if (!idCard || idCard.status !== "ACTIVE") return null;

  return {
    url: idCard.downloadUrl ?? idCard.url,
    fileName: `ID-Card-${idCard.employeeIdCode.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`,
  };
}

export async function markIdCardCompleted(
  employeeId: string,
  supportUserId: string
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new IdCardError("Employee not found", "NOT_FOUND");

  const activeCard = await findActiveIdCard(employeeId);
  if (!activeCard) {
    throw new IdCardError(
      "Generate ID card before marking completed",
      "NO_ID_CARD"
    );
  }

  const completer = await prisma.user.findUnique({
    where: { id: supportUserId },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.ID_CARD_ISSUED,
        updatedAt: new Date(),
      },
    }),
    prisma.idCard.update({
      where: { id: activeCard.id },
      data: {
        completedAt: new Date(),
        completedBy: completer?.id ?? null,
        cardStatus: "COMPLETED",
        updatedAt: new Date(),
      },
    }),
  ]);

  const { fullName } = extractPersonalDetails({
    personalDetails: (employee.personalDetails ?? undefined) as
      | Record<string, unknown>
      | undefined,
  });

  await logAction({
    idCardId: activeCard.id,
    employeeId,
    employeeIdCode: activeCard.employeeIdCode,
    employeeName: fullName,
    action: "COMPLETE",
    performedBy: supportUserId,
    performedByRole: UserRole.SUPPORT,
  });

  await dispatchIdCardGenerated(
    employeeNotifyContext({
      _id: employee.id,
      applicationRef: employee.applicationRef,
      employeeId: employee.employeeId ?? undefined,
      personalDetails: (employee.personalDetails ?? undefined) as
        | Record<string, unknown>
        | undefined,
    })
  );
}
