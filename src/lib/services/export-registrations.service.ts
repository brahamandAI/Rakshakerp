import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@/types/enums";
import {
  asRecord,
  decidedByMatches,
  decisionAction,
  decisionDecidedById,
  isAdminRegistrationEmployee,
  isL1PendingEmployee,
  isL2PendingEmployee,
  isLikelyObjectIdString,
  isScanningCompletedEmployee,
  isScanningPendingEmployee,
} from "@/lib/services/approval-queue";
import {
  buildRegistrationsExcelXml,
  RegistrationExportSource,
} from "@/lib/export/registrations-excel";
import { EmployeeStatus } from "@/types/enums";
import { DOCUMENT_LABELS, DocumentType } from "@/features/onboarding/constants";
import { resolveSubmittedBy } from "@/lib/services/submitter-snapshot";

export type ExportScope = "l1" | "l2" | "admin" | "scanning";

export type ExportOptions = {
  employeeId?: string;
  employeeIds?: string[];
  dateFrom?: string;
  dateTo?: string;
};

type DocSummary = {
  summary: string;
  fileNames: string;
  urls: string;
};

type ExportEmployeeRow = {
  id: string;
  applicationRef: string;
  status: string;
  email: string;
  phone: string;
  employeeId: string | null;
  temporaryEmployeeId: string | null;
  submittedAt: Date | null;
  l1ApprovedAt: Date | null;
  approvedAt: Date | null;
  idGeneratedAt: Date | null;
  forwardedToAdminAt: Date | null;
  forwardedToSupportAt: Date | null;
  scanningCompletedAt: Date | null;
  correctionNotes: string | null;
  rejectionReason: string | null;
  personalDetails: unknown;
  address: unknown;
  education: unknown;
  references: unknown;
  familyDetails: unknown;
  nominee: unknown;
  exServiceman: unknown;
  gunman: unknown;
  additionalDetails: unknown;
  declaration: unknown;
  documentsFolder: unknown;
  submittedBy: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  l1Decision: unknown;
  l2Decision: unknown;
  scanningDecision: unknown;
};

const exportSelect = {
  id: true,
  applicationRef: true,
  status: true,
  email: true,
  phone: true,
  employeeId: true,
  temporaryEmployeeId: true,
  submittedAt: true,
  l1ApprovedAt: true,
  approvedAt: true,
  idGeneratedAt: true,
  forwardedToAdminAt: true,
  forwardedToSupportAt: true,
  scanningCompletedAt: true,
  correctionNotes: true,
  rejectionReason: true,
  personalDetails: true,
  address: true,
  education: true,
  references: true,
  familyDetails: true,
  nominee: true,
  exServiceman: true,
  gunman: true,
  additionalDetails: true,
  declaration: true,
  documentsFolder: true,
  submittedBy: true,
  submittedByName: true,
  submittedByEmail: true,
  l1Decision: true,
  l2Decision: true,
  scanningDecision: true,
} as const;

function mapLeanToExport(
  emp: Record<string, unknown>,
  docs?: DocSummary
): RegistrationExportSource {
  const folder = (emp.documentsFolder as Record<string, unknown> | undefined) ?? {};
  return {
    applicationRef: emp.applicationRef as string | undefined,
    status: emp.status as string | undefined,
    email: emp.email as string | undefined,
    phone: emp.phone as string | undefined,
    employeeId: emp.employeeId as string | undefined,
    temporaryEmployeeId: emp.temporaryEmployeeId as string | undefined,
    submittedAt: emp.submittedAt as Date | undefined,
    l1ApprovedAt: emp.l1ApprovedAt as Date | undefined,
    approvedAt: emp.approvedAt as Date | undefined,
    idGeneratedAt: emp.idGeneratedAt as Date | undefined,
    forwardedToAdminAt: emp.forwardedToAdminAt as Date | undefined,
    correctionNotes: emp.correctionNotes as string | undefined,
    rejectionReason: emp.rejectionReason as string | undefined,
    personalDetails: (emp.personalDetails as Record<string, unknown>) ?? {},
    address: (emp.address as Record<string, unknown>) ?? {},
    education: (emp.education as Record<string, unknown>) ?? {},
    references: (emp.references as unknown[]) ?? [],
    familyDetails: (emp.familyDetails as unknown[]) ?? [],
    nominee: (emp.nominee as Record<string, unknown>) ?? {},
    exServiceman: (emp.exServiceman as Record<string, unknown>) ?? {},
    gunman: (emp.gunman as Record<string, unknown>) ?? {},
    additionalDetails: (emp.additionalDetails as Record<string, unknown>) ?? {},
    declaration: (emp.declaration as Record<string, unknown>) ?? {},
    documentsSummary: docs?.summary,
    documentFileNames: docs?.fileNames,
    documentUrls: docs?.urls,
    documentsFolderName: folder.folderName as string | undefined,
    documentsFolderPath: folder.folderPath as string | undefined,
    submittedBy: resolveSubmittedBy(emp),
    l1Decision: emp.l1Decision as RegistrationExportSource["l1Decision"],
    l2Decision: emp.l2Decision as RegistrationExportSource["l2Decision"],
  };
}

async function fetchDocumentsByEmployee(
  employeeIds: string[]
): Promise<Map<string, DocSummary>> {
  const map = new Map<string, DocSummary>();
  if (employeeIds.length === 0) return map;

  const docs = await prisma.employeeDocument.findMany({
    where: {
      employeeId: { in: employeeIds },
      isActive: true,
    },
    select: {
      employeeId: true,
      documentType: true,
      fileName: true,
      url: true,
    },
  });

  const grouped = new Map<string, typeof docs>();
  for (const doc of docs) {
    const list = grouped.get(doc.employeeId) ?? [];
    list.push(doc);
    grouped.set(doc.employeeId, list);
  }

  for (const [key, list] of grouped) {
    map.set(key, {
      summary: list
        .map((d) => DOCUMENT_LABELS[d.documentType as DocumentType] ?? d.documentType)
        .join("; "),
      fileNames: list.map((d) => d.fileName).join("; "),
      urls: list.map((d) => d.url).join("; "),
    });
  }

  return map;
}

function parseDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000`);
}

function parseDayEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999`);
}

function dateFieldForScope(scope: ExportScope): keyof ExportEmployeeRow {
  if (scope === "l2") return "l1ApprovedAt";
  if (scope === "admin" || scope === "scanning") return "forwardedToAdminAt";
  return "submittedAt";
}

function matchesDateFilter(
  emp: ExportEmployeeRow,
  scope: ExportScope,
  options?: ExportOptions
): boolean {
  if (!options?.dateFrom && !options?.dateTo) return true;
  const field = dateFieldForScope(scope);
  const raw = emp[field];
  if (!(raw instanceof Date)) return false;
  const t = raw.getTime();
  if (options.dateFrom && t < parseDayStart(options.dateFrom).getTime()) {
    return false;
  }
  if (options.dateTo && t > parseDayEnd(options.dateTo).getTime()) {
    return false;
  }
  return true;
}

function assertSingleAllowed(scope: ExportScope, emp: ExportEmployeeRow) {
  const status = emp.status as EmployeeStatus;
  const l1Action = decisionAction(emp.l1Decision);
  const l2Action = decisionAction(emp.l2Decision);

  if (status === EmployeeStatus.DRAFT) {
    throw new Error("Forbidden");
  }

  if (scope === "l2" && l1Action !== "APPROVE") {
    throw new Error("Forbidden");
  }

  if (scope === "admin") {
    if (!(emp.forwardedToAdminAt && emp.temporaryEmployeeId)) {
      throw new Error("Forbidden");
    }
  }

  if (scope === "scanning") {
    const pending =
      !!emp.forwardedToAdminAt &&
      !!emp.temporaryEmployeeId &&
      (l2Action === "APPROVE" || l2Action === "FORWARD") &&
      !emp.scanningCompletedAt &&
      (status === EmployeeStatus.APPROVED ||
        status === EmployeeStatus.ID_GENERATED);
    const completed = !!emp.scanningCompletedAt;
    if (!pending && !completed) {
      throw new Error("Forbidden");
    }
  }
}

const L1_EXPORT_STATUSES = [
  EmployeeStatus.L1_RETURNED,
  EmployeeStatus.L2_RETURNED,
  EmployeeStatus.L2_REVIEW,
  EmployeeStatus.APPROVED,
  EmployeeStatus.ID_GENERATED,
  EmployeeStatus.SCANNING_COMPLETED,
  EmployeeStatus.SUBMITTED,
  EmployeeStatus.L1_REVIEW,
] as const;

function matchesL1ExportScope(emp: ExportEmployeeRow, userId: string): boolean {
  if (isL1PendingEmployee(emp)) return true;
  if (decidedByMatches(emp.l1Decision, userId)) return true;
  return L1_EXPORT_STATUSES.includes(emp.status as (typeof L1_EXPORT_STATUSES)[number]);
}

function matchesL2ExportScope(emp: ExportEmployeeRow, userId: string): boolean {
  if (isL2PendingEmployee(emp)) return true;
  if (decisionAction(emp.l1Decision) === "APPROVE") return true;
  if (decidedByMatches(emp.l2Decision, userId)) return true;
  return false;
}

function matchesScanningExportScope(emp: ExportEmployeeRow): boolean {
  return isScanningPendingEmployee(emp) || isScanningCompletedEmployee(emp);
}

async function loadUserNameMap(
  ids: string[]
): Promise<Map<string, { name: string; email: string }>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, email: true },
  });
  return new Map(users.map((u) => [u.id, { name: u.name, email: u.email }]));
}

function toExportRecord(
  emp: ExportEmployeeRow,
  users: Map<string, { name: string; email: string }>
): Record<string, unknown> {
  const submitterUser = emp.submittedBy ? users.get(emp.submittedBy) : undefined;
  const l1 = asRecord(emp.l1Decision);
  const l2 = asRecord(emp.l2Decision);
  const l1By = decisionDecidedById(emp.l1Decision);
  const l2By = decisionDecidedById(emp.l2Decision);
  const l1User = l1By ? users.get(l1By) : undefined;
  const l2User = l2By ? users.get(l2By) : undefined;

  return {
    _id: emp.id,
    applicationRef: emp.applicationRef,
    status: emp.status,
    email: emp.email,
    phone: emp.phone,
    employeeId: emp.employeeId ?? undefined,
    temporaryEmployeeId: emp.temporaryEmployeeId ?? undefined,
    submittedAt: emp.submittedAt ?? undefined,
    l1ApprovedAt: emp.l1ApprovedAt ?? undefined,
    approvedAt: emp.approvedAt ?? undefined,
    idGeneratedAt: emp.idGeneratedAt ?? undefined,
    forwardedToAdminAt: emp.forwardedToAdminAt ?? undefined,
    correctionNotes: emp.correctionNotes ?? undefined,
    rejectionReason: emp.rejectionReason ?? undefined,
    personalDetails: emp.personalDetails ?? {},
    address: emp.address ?? {},
    education: emp.education ?? {},
    references: emp.references ?? [],
    familyDetails: emp.familyDetails ?? [],
    nominee: emp.nominee ?? {},
    exServiceman: emp.exServiceman ?? {},
    gunman: emp.gunman ?? {},
    additionalDetails: emp.additionalDetails ?? {},
    declaration: emp.declaration ?? {},
    documentsFolder: emp.documentsFolder ?? {},
    submittedBy: submitterUser
      ? { name: submitterUser.name, email: submitterUser.email }
      : emp.submittedBy,
    submittedByName: emp.submittedByName,
    submittedByEmail: emp.submittedByEmail,
    l1Decision: l1
      ? {
          ...l1,
          decidedBy: l1User ? { name: l1User.name } : l1.decidedBy,
        }
      : null,
    l2Decision: l2
      ? {
          ...l2,
          decidedBy: l2User ? { name: l2User.name } : l2.decidedBy,
        }
      : null,
  };
}

function sortByDateDesc(
  items: ExportEmployeeRow[],
  field: keyof ExportEmployeeRow
): ExportEmployeeRow[] {
  return [...items].sort((a, b) => {
    const aTime =
      a[field] instanceof Date ? (a[field] as Date).getTime() : 0;
    const bTime =
      b[field] instanceof Date ? (b[field] as Date).getTime() : 0;
    return bTime - aTime;
  });
}

async function fetchForScope(
  scope: ExportScope,
  userId: string,
  options?: ExportOptions
): Promise<ExportEmployeeRow[]> {
  const idList = [
    ...(options?.employeeId ? [options.employeeId] : []),
    ...(options?.employeeIds ?? []),
  ].filter(Boolean) as string[];

  if (idList.length > 0) {
    const validIds = idList.filter(isLikelyObjectIdString);
    if (validIds.length === 0) {
      throw new Error("Invalid employee id");
    }

    let items = await prisma.employee.findMany({
      where: { id: { in: validIds } },
      select: exportSelect,
    });

    for (const item of items) {
      assertSingleAllowed(scope, item);
    }

    if (options?.dateFrom || options?.dateTo) {
      items = items.filter((item) => matchesDateFilter(item, scope, options));
    }

    void userId;
    return items;
  }

  if (scope === "l1") {
    const candidates = await prisma.employee.findMany({
      where: {
        status: { not: EmployeeStatus.DRAFT },
      },
      select: exportSelect,
      take: 5000,
    });
    return sortByDateDesc(
      candidates
        .filter((e) => matchesL1ExportScope(e, userId))
        .filter((e) => matchesDateFilter(e, scope, options))
        .slice(0, 2000),
      "submittedAt"
    );
  }

  if (scope === "l2") {
    const candidates = await prisma.employee.findMany({
      where: {
        status: { not: EmployeeStatus.DRAFT },
      },
      select: exportSelect,
      take: 5000,
    });
    return sortByDateDesc(
      candidates
        .filter((e) => matchesL2ExportScope(e, userId))
        .filter((e) => matchesDateFilter(e, scope, options))
        .slice(0, 2000),
      "l1ApprovedAt"
    );
  }

  if (scope === "scanning") {
    const candidates = await prisma.employee.findMany({
      where: {
        OR: [
          {
            forwardedToAdminAt: { not: null },
            temporaryEmployeeId: { not: null },
            status: {
              in: [EmployeeStatus.APPROVED, EmployeeStatus.ID_GENERATED],
            },
          },
          { scanningCompletedAt: { not: null } },
        ],
      },
      select: exportSelect,
      take: 5000,
    });
    return sortByDateDesc(
      candidates
        .filter(matchesScanningExportScope)
        .filter((e) => matchesDateFilter(e, scope, options))
        .slice(0, 2000),
      "forwardedToAdminAt"
    );
  }

  const candidates = await prisma.employee.findMany({
    where: {
      forwardedToAdminAt: { not: null },
      temporaryEmployeeId: { not: null },
      status: {
        in: [
          EmployeeStatus.APPROVED,
          EmployeeStatus.ID_GENERATED,
          EmployeeStatus.SCANNING_COMPLETED,
          EmployeeStatus.ID_CARD_ISSUED,
        ],
      },
    },
    select: exportSelect,
    take: 8000,
  });
  return sortByDateDesc(
    candidates
      .filter(isAdminRegistrationEmployee)
      .filter((e) => matchesDateFilter(e, scope, options))
      .slice(0, 5000),
    "forwardedToAdminAt"
  );
}

async function mapWithDocuments(items: ExportEmployeeRow[]) {
  const ids = items.map((item) => item.id);
  const docsMap = await fetchDocumentsByEmployee(ids);
  const userIds: string[] = [];
  for (const emp of items) {
    if (emp.submittedBy) userIds.push(emp.submittedBy);
    const l1By = decisionDecidedById(emp.l1Decision);
    if (l1By) userIds.push(l1By);
    const l2By = decisionDecidedById(emp.l2Decision);
    if (l2By) userIds.push(l2By);
  }
  const users = await loadUserNameMap(userIds);

  return items.map((item) =>
    mapLeanToExport(toExportRecord(item, users), docsMap.get(item.id))
  );
}

export async function exportRegistrationsExcel(
  scope: ExportScope,
  userId: string,
  options?: ExportOptions
): Promise<{ filename: string; xml: string; count: number }> {
  const items = await fetchForScope(scope, userId, options);
  const rows = await mapWithDocuments(items);
  const xml = buildRegistrationsExcelXml(rows);
  const date = new Date().toISOString().slice(0, 10);
  const single = options?.employeeId
    ? `-${String((rows[0]?.applicationRef as string | undefined) ?? options.employeeId).replace(/[^\w-]/g, "")}`
    : options?.employeeIds?.length
      ? `-sel${options.employeeIds.length}`
      : "";
  return {
    filename: `empdetails-${scope}${single}-${date}.xls`,
    xml,
    count: rows.length,
  };
}

export async function previewRegistrationsExport(
  scope: ExportScope,
  userId: string,
  options?: ExportOptions
): Promise<{
  count: number;
  columns: string[];
  rows: Record<string, string>[];
}> {
  const { getExportPreviewRows } = await import(
    "@/lib/export/registrations-excel"
  );
  const items = await fetchForScope(scope, userId, options);
  const mapped = await mapWithDocuments(items);
  const limit =
    options?.employeeId ||
    (options?.employeeIds && options.employeeIds.length <= 25)
      ? Math.max(options?.employeeIds?.length ?? 1, 1)
      : 25;
  return getExportPreviewRows(mapped, limit);
}

export function assertExportRole(role: string, scope: ExportScope) {
  if (scope === "l1" && role !== UserRole.L1 && role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
  if (scope === "l2" && role !== UserRole.L2 && role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
  if (
    scope === "scanning" &&
    role !== UserRole.SCANNING &&
    role !== UserRole.ADMIN
  ) {
    throw new Error("Forbidden");
  }
  if (scope === "admin" && role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
}
