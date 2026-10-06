import { EmployeeStatus } from "@/types/enums";
import { resolveSubmittedBy } from "@/lib/services/submitter-snapshot";

/**
 * RSC → Client Component props must be plain JSON.
 * Mongoose ObjectIds / Dates have toJSON and will crash the flight serializer.
 */
export function toClientProps<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (val instanceof Date) return val.toISOString();
      if (
        val &&
        typeof val === "object" &&
        typeof (val as { toHexString?: () => string }).toHexString === "function"
      ) {
        return (val as { toHexString: () => string }).toHexString();
      }
      return val;
    })
  ) as T;
}

export function clientIsoDate(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function clientNamedUser(
  value: unknown
): { name?: string; email?: string } | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as { name?: unknown; email?: unknown };
  const name = typeof rec.name === "string" && rec.name ? rec.name : undefined;
  const email = typeof rec.email === "string" && rec.email ? rec.email : undefined;
  if (!name && !email) return null;
  return { name, email };
}

export function clientHistoryActor(value: unknown): { name?: string } | undefined {
  const user = clientNamedUser(value);
  return user?.name ? { name: user.name } : undefined;
}

export function clientMixed(
  value: unknown
): Record<string, unknown> | undefined {
  if (value == null) return undefined;
  return toClientProps(value) as Record<string, unknown>;
}

export function clientMixedList(
  value: unknown
): Record<string, unknown>[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return toClientProps(value) as Record<string, unknown>[];
}

export function clientFieldChanges(
  value: unknown
): Array<{ path: string; label: string; oldValue: string; newValue: string }> | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value.map((item) => {
    const rec = (item ?? {}) as Record<string, unknown>;
    return {
      path: String(rec.path ?? ""),
      label: String(rec.label ?? ""),
      oldValue: String(rec.oldValue ?? ""),
      newValue: String(rec.newValue ?? ""),
    };
  });
}

export function clientHistoryItems(
  history: Array<{
    action?: unknown;
    fromStatus?: unknown;
    toStatus?: unknown;
    comment?: unknown;
    createdAt?: unknown;
    performedBy?: unknown;
    performedByRole?: unknown;
  }>
) {
  return toClientProps(
    history.map((item) => ({
      action: String(item.action ?? ""),
      fromStatus: String(item.fromStatus ?? ""),
      toStatus: String(item.toStatus ?? ""),
      comment: item.comment != null ? String(item.comment) : undefined,
      createdAt: clientIsoDate(item.createdAt) ?? "",
      performedBy: clientHistoryActor(item.performedBy),
      performedByRole:
        item.performedByRole != null ? String(item.performedByRole) : undefined,
    }))
  );
}

type ReviewDecision = {
  action?: unknown;
  comment?: unknown;
  approvedByName?: unknown;
  decidedAt?: unknown;
  decidedBy?: unknown;
};

function clientDecision(decision?: ReviewDecision | null) {
  if (!decision) return undefined;
  return {
    action: String(decision.action ?? ""),
    comment: decision.comment != null ? String(decision.comment) : undefined,
    approvedByName:
      decision.approvedByName != null
        ? String(decision.approvedByName)
        : undefined,
    decidedAt: clientIsoDate(decision.decidedAt),
    decidedBy: clientNamedUser(decision.decidedBy),
  };
}

/** Full employee payload for L1/L2 Client Component detail views. */
export function serializeReviewEmployee(employee: {
  _id: unknown;
  applicationRef: string;
  status: EmployeeStatus;
  email: string;
  phone: string;
  employeeId?: string;
  temporaryEmployeeId?: string;
  personalDetails?: unknown;
  address?: unknown;
  education?: unknown;
  references?: unknown;
  familyDetails?: unknown;
  nominee?: unknown;
  exServiceman?: unknown;
  gunman?: unknown;
  additionalDetails?: unknown;
  declaration?: unknown;
  submittedAt?: unknown;
  submittedBy?: unknown;
  submittedByName?: unknown;
  submittedByEmail?: unknown;
  l1Decision?: ReviewDecision | null;
  l2Decision?: ReviewDecision | null;
  scanningDecision?: ReviewDecision | null;
  scanningCompletedAt?: unknown;
  correctionNotes?: string;
  rejectionReason?: string;
  forwardedToSupportAt?: unknown;
  forwardedToAdminAt?: unknown;
  pendingFieldChanges?: unknown;
}) {
  return toClientProps({
    _id: String(employee._id),
    applicationRef: employee.applicationRef,
    status: employee.status,
    email: employee.email,
    phone: employee.phone,
    employeeId: employee.employeeId,
    temporaryEmployeeId: employee.temporaryEmployeeId,
    personalDetails: clientMixed(employee.personalDetails),
    address: clientMixed(employee.address),
    education: Array.isArray(employee.education)
      ? clientMixedList(employee.education)
      : clientMixed(employee.education),
    references: clientMixedList(employee.references),
    familyDetails: clientMixedList(employee.familyDetails),
    nominee: clientMixed(employee.nominee),
    exServiceman: clientMixed(employee.exServiceman),
    gunman: clientMixed(employee.gunman),
    additionalDetails: clientMixed(employee.additionalDetails),
    declaration: clientMixed(employee.declaration),
    submittedAt: clientIsoDate(employee.submittedAt),
    submittedBy: resolveSubmittedBy(employee),
    l1Decision: clientDecision(employee.l1Decision),
    l2Decision: clientDecision(employee.l2Decision),
    scanningDecision: clientDecision(employee.scanningDecision),
    scanningCompletedAt: clientIsoDate(employee.scanningCompletedAt),
    correctionNotes: employee.correctionNotes,
    rejectionReason: employee.rejectionReason,
    forwardedToSupportAt: clientIsoDate(employee.forwardedToSupportAt),
    forwardedToAdminAt: clientIsoDate(employee.forwardedToAdminAt),
    pendingFieldChanges: clientFieldChanges(employee.pendingFieldChanges),
  });
}

/** Subset used by admin / support / submitter read-only registration views. */
export function serializeRegistrationEmployee(employee: {
  applicationRef: string;
  status: unknown;
  temporaryEmployeeId?: string;
  personalDetails?: unknown;
  address?: unknown;
  education?: unknown;
  references?: unknown;
  familyDetails?: unknown;
  nominee?: unknown;
  additionalDetails?: unknown;
  exServiceman?: unknown;
  gunman?: unknown;
  rejectionReason?: string | null;
  correctionNotes?: string | null;
  submittedBy?: unknown;
  submittedByName?: unknown;
  submittedByEmail?: unknown;
}) {
  return toClientProps({
    applicationRef: employee.applicationRef,
    status: String(employee.status),
    temporaryEmployeeId: employee.temporaryEmployeeId,
    personalDetails: clientMixed(employee.personalDetails),
    address: clientMixed(employee.address),
    education: Array.isArray(employee.education)
      ? clientMixedList(employee.education)
      : clientMixed(employee.education),
    references: clientMixedList(employee.references),
    familyDetails: clientMixedList(employee.familyDetails),
    nominee: clientMixed(employee.nominee),
    additionalDetails: clientMixed(employee.additionalDetails),
    exServiceman: clientMixed(employee.exServiceman),
    gunman: clientMixed(employee.gunman),
    rejectionReason: employee.rejectionReason ?? undefined,
    correctionNotes: employee.correctionNotes ?? undefined,
    submittedBy: resolveSubmittedBy(employee),
  });
}

export function serializeRegistrationDocuments(
  documents: Array<{ documentType: string; fileName: string; url?: string }>
) {
  return toClientProps(
    documents.map((doc) => ({
      documentType: doc.documentType,
      fileName: doc.fileName,
      url: doc.url ?? "",
    }))
  );
}
