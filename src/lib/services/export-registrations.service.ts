import { connectDB } from "@/lib/db/connect";
import { Employee } from "@/lib/db/models/Employee";
import { EmployeeDocument } from "@/lib/db/models/EmployeeDocument";
import { UserRole } from "@/types/enums";
import {
  L1_PENDING_FILTER,
  L2_PENDING_FILTER,
  ADMIN_REGISTRATIONS_FILTER,
} from "@/lib/services/approval-queue";
import {
  buildRegistrationsExcelXml,
  RegistrationExportSource,
} from "@/lib/export/registrations-excel";
import { EmployeeStatus } from "@/types/enums";
import { DOCUMENT_LABELS, DocumentType } from "@/features/onboarding/constants";
import mongoose from "mongoose";
import { resolveSubmittedBy } from "@/lib/services/submitter-snapshot";

export type ExportScope = "l1" | "l2" | "admin";

type DocSummary = {
  summary: string;
  fileNames: string;
  urls: string;
};

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
  employeeIds: mongoose.Types.ObjectId[]
): Promise<Map<string, DocSummary>> {
  const map = new Map<string, DocSummary>();
  if (employeeIds.length === 0) return map;

  const docs = await EmployeeDocument.find({
    employeeId: { $in: employeeIds },
    isActive: true,
  })
    .select("employeeId documentType fileName url")
    .lean();

  const grouped = new Map<string, typeof docs>();
  for (const doc of docs) {
    const key = String(doc.employeeId);
    const list = grouped.get(key) ?? [];
    list.push(doc);
    grouped.set(key, list);
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

async function fetchForScope(scope: ExportScope, userId: string) {
  await connectDB();

  const populate = [
    { path: "submittedBy", select: "name email" },
    { path: "l1Decision.decidedBy", select: "name" },
    { path: "l2Decision.decidedBy", select: "name" },
  ];

  if (scope === "l1") {
    const items = await Employee.find({
      $or: [
        L1_PENDING_FILTER,
        { "l1Decision.decidedBy": userId },
        {
          status: {
            $in: [
              EmployeeStatus.L1_RETURNED,
              EmployeeStatus.L2_RETURNED,
              EmployeeStatus.L2_REVIEW,
              EmployeeStatus.APPROVED,
              EmployeeStatus.ID_GENERATED,
            ],
          },
        },
      ],
    })
      .populate(populate)
      .sort({ submittedAt: -1 })
      .limit(2000)
      .lean();
    return items;
  }

  if (scope === "l2") {
    const items = await Employee.find({
      $or: [
        L2_PENDING_FILTER,
        { "l1Decision.action": "APPROVE" },
        { "l2Decision.decidedBy": userId },
      ],
    })
      .populate(populate)
      .sort({ l1ApprovedAt: -1 })
      .limit(2000)
      .lean();
    return items;
  }

  const items = await Employee.find(ADMIN_REGISTRATIONS_FILTER)
    .populate(populate)
    .sort({ forwardedToAdminAt: -1 })
    .limit(5000)
    .lean();
  return items;
}

async function mapWithDocuments(items: Record<string, unknown>[]) {
  const ids = items
    .map((item) => item._id)
    .filter(Boolean) as mongoose.Types.ObjectId[];
  const docsMap = await fetchDocumentsByEmployee(ids);
  return items.map((item) =>
    mapLeanToExport(item, docsMap.get(String(item._id)))
  );
}

export async function exportRegistrationsExcel(
  scope: ExportScope,
  userId: string
): Promise<{ filename: string; xml: string; count: number }> {
  const items = await fetchForScope(scope, userId);
  const rows = await mapWithDocuments(items as unknown as Record<string, unknown>[]);
  const xml = buildRegistrationsExcelXml(rows);
  const date = new Date().toISOString().slice(0, 10);
  return {
    filename: `registrations-${scope}-${date}.xls`,
    xml,
    count: rows.length,
  };
}

export async function previewRegistrationsExport(
  scope: ExportScope,
  userId: string
): Promise<{
  count: number;
  columns: string[];
  rows: Record<string, string>[];
}> {
  const { getExportPreviewRows } = await import("@/lib/export/registrations-excel");
  const items = await fetchForScope(scope, userId);
  const mapped = await mapWithDocuments(items as unknown as Record<string, unknown>[]);
  return getExportPreviewRows(mapped, 25);
}

export function assertExportRole(role: string, scope: ExportScope) {
  if (scope === "l1" && role !== UserRole.L1 && role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
  if (scope === "l2" && role !== UserRole.L2 && role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
  if (scope === "admin" && role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
}
