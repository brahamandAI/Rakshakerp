import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  DOCUMENT_LABELS,
  DocumentType,
} from "@/features/onboarding/constants";
import {
  EMPLOYEE_DOCUMENTS_MASTER_FOLDER,
  getEmployeeDocumentsCloudinaryRoot,
  sanitizeFolderSegment,
} from "@/lib/cloudinary/config";
import { moveDocumentInCloudinary } from "@/lib/cloudinary/upload";
import { EmployeeStatus, UserRole, StaffRole } from "@/types/enums";
import { decisionAction, asRecord } from "@/lib/services/approval-queue";

export interface DocumentsFolderInfo {
  folderName: string;
  folderPath: string;
  cloudinaryFolder: string;
  documentCount: number;
  temporaryEmployeeId: string;
  employeeName: string;
  organizedAt: string;
}

export interface FolderDocumentItem {
  _id: string;
  documentType: string;
  label: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  folderRelativePath: string;
  url: string;
}

type DocumentsFolderJson = {
  folderName?: string;
  folderPath?: string;
  cloudinaryFolder?: string;
  documentCount?: number;
  temporaryEmployeeId?: string;
  employeeName?: string;
  organizedAt?: string | Date;
};

function buildFolderName(temporaryEmployeeId: string, employeeName: string): string {
  const idPart = sanitizeFolderSegment(temporaryEmployeeId);
  const namePart = sanitizeFolderSegment(employeeName || "Employee");
  return `${idPart} - ${namePart}`;
}

function sanitizeFileBase(fileName: string): string {
  const base = fileName.replace(/[\\/:*?"<>|]+/g, "-").trim();
  return base || `document_${Date.now()}`;
}

function extensionFromFileName(fileName: string, mimeType: string): string {
  const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
  if (match) return match[1];
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("webp")) return ".webp";
  return ".jpg";
}

function parseDocumentsFolder(value: unknown): DocumentsFolderJson | null {
  const rec = asRecord(value);
  if (!rec) return null;
  return rec as DocumentsFolderJson;
}

/**
 * After L2 approval + temporary employee ID generation, create the logical
 * Employee Documents folder and move/copy Cloudinary assets into it.
 */
export async function organizeEmployeeDocumentsFolder(
  employeeId: string
): Promise<DocumentsFolderInfo | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return null;

  const temporaryEmployeeId =
    employee.temporaryEmployeeId || employee.employeeId;
  if (!temporaryEmployeeId) return null;

  const existingFolder = parseDocumentsFolder(employee.documentsFolder);

  // Idempotent: if folder already organized, refresh count and return
  if (existingFolder?.folderPath && existingFolder.folderName) {
    const count = await prisma.employeeDocument.count({
      where: { employeeId: employee.id, isActive: true },
    });
    if (existingFolder.documentCount !== count) {
      const updatedFolder = {
        ...existingFolder,
        documentCount: count,
      };
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          documentsFolder: updatedFolder as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
    }
    return {
      folderName: existingFolder.folderName,
      folderPath: existingFolder.folderPath,
      cloudinaryFolder: existingFolder.cloudinaryFolder ?? "",
      documentCount: count,
      temporaryEmployeeId:
        existingFolder.temporaryEmployeeId ?? temporaryEmployeeId,
      employeeName: existingFolder.employeeName ?? "Employee",
      organizedAt: new Date(
        existingFolder.organizedAt ?? Date.now()
      ).toISOString(),
    };
  }

  const personal = asRecord(employee.personalDetails) as {
    fullName?: string;
  } | null;
  const employeeName = personal?.fullName?.trim() || "Employee";
  const folderName = buildFolderName(temporaryEmployeeId, employeeName);
  const folderPath = `${EMPLOYEE_DOCUMENTS_MASTER_FOLDER}/${folderName}`;
  const cloudinaryFolder = `${getEmployeeDocumentsCloudinaryRoot()}/${folderName}`;

  const docs = await prisma.employeeDocument.findMany({
    where: { employeeId: employee.id, isActive: true },
  });

  const now = new Date();
  const docUpdates: Array<{
    id: string;
    folderLabel: string;
    folderRelativePath: string;
    url: string;
  }> = [];

  for (const doc of docs) {
    const label =
      DOCUMENT_LABELS[doc.documentType as DocumentType] ?? doc.documentType;
    const labelFolder = sanitizeFolderSegment(label);
    const originalBase = sanitizeFileBase(doc.fileName);
    const ext = extensionFromFileName(doc.fileName, doc.mimeType);
    const publicIdBase = originalBase.replace(/\.[^/.]+$/, "");
    const targetPublicId = `${labelFolder}/${publicIdBase}`;

    const moved = await moveDocumentInCloudinary({
      sourceUrl: doc.url,
      targetFolder: cloudinaryFolder,
      targetPublicId,
      mimeType: doc.mimeType,
    });

    const folderRelativePath = `${labelFolder}/${
      originalBase.endsWith(ext) ? originalBase : `${publicIdBase}${ext}`
    }`;

    docUpdates.push({
      id: doc.id,
      folderLabel: label,
      folderRelativePath,
      url: moved?.url ?? doc.url,
    });
  }

  const documentCount = docs.length;
  const documentsFolder = {
    folderName,
    folderPath,
    cloudinaryFolder,
    documentCount,
    temporaryEmployeeId,
    employeeName,
    organizedAt: now.toISOString(),
  };

  await prisma.$transaction([
    ...docUpdates.map((u) =>
      prisma.employeeDocument.update({
        where: { id: u.id },
        data: {
          folderLabel: u.folderLabel,
          folderRelativePath: u.folderRelativePath,
          url: u.url,
          updatedAt: now,
        },
      })
    ),
    prisma.employee.update({
      where: { id: employee.id },
      data: {
        documentsFolder: documentsFolder as Prisma.InputJsonValue,
        updatedAt: now,
      },
    }),
  ]);

  return {
    folderName,
    folderPath,
    cloudinaryFolder,
    documentCount,
    temporaryEmployeeId,
    employeeName,
    organizedAt: now.toISOString(),
  };
}

function isPostL2Approved(
  status: EmployeeStatus,
  employee: {
    forwardedToAdminAt?: Date | null;
    forwardedToSupportAt?: Date | null;
    temporaryEmployeeId?: string | null;
    l2Decision?: { action?: string } | null;
  }
): boolean {
  if (employee.temporaryEmployeeId) return true;
  if (employee.forwardedToAdminAt || employee.forwardedToSupportAt) return true;
  if (
    employee.l2Decision?.action === "APPROVE" ||
    employee.l2Decision?.action === "FORWARD"
  ) {
    return true;
  }
  return [
    EmployeeStatus.APPROVED,
    EmployeeStatus.ID_GENERATED,
    EmployeeStatus.SCANNING_COMPLETED,
    EmployeeStatus.ID_CARD_ISSUED,
  ].includes(status);
}

export function canAccessDocumentsFolder(params: {
  role: StaffRole;
  userId: string;
  employee: {
    status: EmployeeStatus;
    submittedBy?: { toString(): string } | string | null;
    temporaryEmployeeId?: string | null;
    forwardedToAdminAt?: Date | null;
    forwardedToSupportAt?: Date | null;
    l2Decision?: { action?: string } | null;
    documentsFolder?: unknown;
  };
}): { allowed: boolean; canDownloadZip: boolean; readOnly: boolean; reason?: string } {
  const { role, userId, employee } = params;
  const postApproved = isPostL2Approved(employee.status, employee);

  if (role === UserRole.ADMIN) {
    return { allowed: true, canDownloadZip: true, readOnly: true };
  }

  if (role === UserRole.SUPPORT) {
    if (!postApproved) {
      return {
        allowed: false,
        canDownloadZip: false,
        readOnly: true,
        reason: "Support can access folders only after L2 approval",
      };
    }
    return { allowed: true, canDownloadZip: true, readOnly: true };
  }

  if (role === UserRole.L2) {
    const pending =
      employee.status === EmployeeStatus.L2_REVIEW ||
      employee.l2Decision?.action === "APPROVE" ||
      postApproved;
    if (!pending && !postApproved) {
      return {
        allowed: false,
        canDownloadZip: false,
        readOnly: true,
        reason: "Not authorized for this registration",
      };
    }
    return { allowed: true, canDownloadZip: true, readOnly: true };
  }

  if (role === UserRole.SCANNING) {
    if (!postApproved) {
      return {
        allowed: false,
        canDownloadZip: false,
        readOnly: true,
        reason: "Scanning can access folders only after L2 approval",
      };
    }
    return { allowed: true, canDownloadZip: true, readOnly: true };
  }

  if (role === UserRole.L1) {
    const reviewing = [
      EmployeeStatus.SUBMITTED,
      EmployeeStatus.L1_REVIEW,
    ].includes(employee.status);
    if (!reviewing) {
      return {
        allowed: false,
        canDownloadZip: false,
        readOnly: true,
        reason: "L1 can view documents only while reviewing pending registrations",
      };
    }
    return { allowed: true, canDownloadZip: false, readOnly: true };
  }

  if (role === UserRole.SUBMITTER) {
    const submittedBy =
      typeof employee.submittedBy === "string"
        ? employee.submittedBy
        : employee.submittedBy?.toString();
    if (submittedBy !== userId) {
      return {
        allowed: false,
        canDownloadZip: false,
        readOnly: true,
        reason: "Submitters can only access their own employee folders",
      };
    }
    return { allowed: true, canDownloadZip: false, readOnly: true };
  }

  return {
    allowed: false,
    canDownloadZip: false,
    readOnly: true,
    reason: "Forbidden",
  };
}

export interface MasterFolderListItem {
  employeeId: string;
  folderName: string;
  folderPath: string;
  documentCount: number;
  temporaryEmployeeId: string;
  employeeName: string;
  organizedAt: string;
  applicationRef?: string;
}

/**
 * List organized employee folders under the main "Employee Documents" root,
 * filtered by the caller's role permissions.
 */
export async function listEmployeeDocumentFolders(params: {
  role: StaffRole;
  userId: string;
}): Promise<{
  masterFolder: string;
  folders: MasterFolderListItem[];
}> {
  if (
    params.role === UserRole.L1 ||
    params.role === UserRole.PAYROLL_MANAGER ||
    params.role === UserRole.PAYROLL_EXECUTIVE
  ) {
    return { masterFolder: EMPLOYEE_DOCUMENTS_MASTER_FOLDER, folders: [] };
  }

  const candidates = await prisma.employee.findMany({
    where: {
      ...(params.role === UserRole.SUBMITTER
        ? { submittedBy: params.userId }
        : {}),
      NOT: { documentsFolder: { equals: Prisma.DbNull } },
    },
    select: {
      id: true,
      applicationRef: true,
      documentsFolder: true,
      submittedBy: true,
      status: true,
      temporaryEmployeeId: true,
      forwardedToAdminAt: true,
      forwardedToSupportAt: true,
      l2Decision: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });

  const folders: MasterFolderListItem[] = [];

  for (const emp of candidates) {
    const df = parseDocumentsFolder(emp.documentsFolder);
    if (!df?.folderName || !df?.folderPath) continue;

    // Preserve prior role filters that used Mongo $or for support/L2
    if (
      params.role === UserRole.SUPPORT ||
      params.role === UserRole.L2 ||
      params.role === UserRole.SCANNING
    ) {
      const l2Action = decisionAction(emp.l2Decision);
      const eligible =
        Boolean(emp.temporaryEmployeeId) ||
        Boolean(emp.forwardedToAdminAt) ||
        Boolean(emp.forwardedToSupportAt) ||
        l2Action === "APPROVE" ||
        l2Action === "FORWARD" ||
        [
          EmployeeStatus.APPROVED,
          EmployeeStatus.ID_GENERATED,
          EmployeeStatus.SCANNING_COMPLETED,
          EmployeeStatus.ID_CARD_ISSUED,
        ].includes(emp.status as EmployeeStatus);
      if (!eligible) continue;
    }

    const access = canAccessDocumentsFolder({
      role: params.role,
      userId: params.userId,
      employee: {
        status: emp.status as EmployeeStatus,
        submittedBy: emp.submittedBy ?? undefined,
        temporaryEmployeeId: emp.temporaryEmployeeId,
        forwardedToAdminAt: emp.forwardedToAdminAt,
        forwardedToSupportAt: emp.forwardedToSupportAt,
        l2Decision: l2DecisionAction(emp.l2Decision),
        documentsFolder: df,
      },
    });

    if (!access.allowed) continue;

    folders.push({
      employeeId: emp.id,
      folderName: df.folderName,
      folderPath: df.folderPath,
      documentCount: df.documentCount ?? 0,
      temporaryEmployeeId: df.temporaryEmployeeId ?? emp.temporaryEmployeeId ?? "",
      employeeName: df.employeeName ?? "Employee",
      organizedAt: new Date(df.organizedAt ?? Date.now()).toISOString(),
      applicationRef: emp.applicationRef,
    });
  }

  folders.sort((a, b) => b.organizedAt.localeCompare(a.organizedAt));

  return {
    masterFolder: EMPLOYEE_DOCUMENTS_MASTER_FOLDER,
    folders,
  };
}

function l2DecisionAction(
  value: unknown
): { action?: string } | undefined {
  const action = decisionAction(value);
  return action ? { action } : undefined;
}

export async function getEmployeeDocumentsFolder(
  employeeId: string
): Promise<{
  folder: DocumentsFolderInfo | null;
  documents: FolderDocumentItem[];
  employeeStatus: EmployeeStatus;
  submittedBy?: string;
  temporaryEmployeeId?: string;
  forwardedToAdminAt?: Date;
  forwardedToSupportAt?: Date;
  l2Decision?: { action?: string };
} | null> {
  let employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return null;

  let folderJson = parseDocumentsFolder(employee.documentsFolder);

  // Lazy organize for already-approved registrations missing a folder
  if (
    !folderJson?.folderPath &&
    (employee.temporaryEmployeeId || employee.employeeId) &&
    isPostL2Approved(employee.status as EmployeeStatus, {
      temporaryEmployeeId: employee.temporaryEmployeeId,
      forwardedToAdminAt: employee.forwardedToAdminAt,
      forwardedToSupportAt: employee.forwardedToSupportAt,
      l2Decision: l2DecisionAction(employee.l2Decision),
    })
  ) {
    await organizeEmployeeDocumentsFolder(employeeId);
    employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) return null;
    folderJson = parseDocumentsFolder(employee.documentsFolder);
  }

  const docs = await prisma.employeeDocument.findMany({
    where: { employeeId, isActive: true },
    orderBy: { documentType: "asc" },
  });

  const folder = folderJson?.folderName && folderJson.folderPath
    ? {
        folderName: folderJson.folderName,
        folderPath: folderJson.folderPath,
        cloudinaryFolder: folderJson.cloudinaryFolder ?? "",
        documentCount: folderJson.documentCount ?? docs.length,
        temporaryEmployeeId:
          folderJson.temporaryEmployeeId ??
          employee.temporaryEmployeeId ??
          "",
        employeeName: folderJson.employeeName ?? "Employee",
        organizedAt: new Date(
          folderJson.organizedAt ?? Date.now()
        ).toISOString(),
      }
    : null;

  return {
    folder,
    documents: docs.map((d) => ({
      _id: d.id,
      documentType: d.documentType,
      label:
        d.folderLabel ||
        DOCUMENT_LABELS[d.documentType as DocumentType] ||
        d.documentType,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      folderRelativePath:
        d.folderRelativePath ||
        `${DOCUMENT_LABELS[d.documentType as DocumentType] || d.documentType}/${d.fileName}`,
      url: d.url,
    })),
    employeeStatus: employee.status as EmployeeStatus,
    submittedBy: employee.submittedBy ?? undefined,
    temporaryEmployeeId: employee.temporaryEmployeeId ?? undefined,
    forwardedToAdminAt: employee.forwardedToAdminAt ?? undefined,
    forwardedToSupportAt: employee.forwardedToSupportAt ?? undefined,
    l2Decision: l2DecisionAction(employee.l2Decision),
  };
}
