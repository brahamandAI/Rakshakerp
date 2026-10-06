"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/l1/components/StatusBadge";
import { L2ActionPanel } from "@/features/l2/components/L2ActionPanel";
import { ScanningActionPanel } from "@/features/scanning/components/ScanningActionPanel";
import { FieldChangesPanel } from "@/features/approval/components/FieldChangesPanel";
import { EmployeeDocumentsFolderPanel } from "@/features/documents/components/EmployeeDocumentsFolderPanel";
import {
  DocumentPreviewGrid,
  PreviewDocument,
} from "@/features/documents/components/DocumentPreviewGrid";
import { ApprovalTimeline } from "@/components/dashboard/ApprovalTimeline";
import { LiveBadge } from "@/components/dashboard/LiveBadge";
import { EmployeeStatus } from "@/types/enums";
import {
  LucideIcon,
  User,
  MapPin,
  GraduationCap,
  Users,
  HeartHandshake,
  FileText,
  Shield,
  IdCard,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";
import {
  flattenDisplayEntries,
  formatDisplayValue,
  humanizeKey,
} from "@/lib/utils/display-value";

interface HistoryItem {
  action: string;
  fromStatus: string;
  toStatus: string;
  comment?: string;
  createdAt: string | Date;
  performedBy?: { name?: string };
}

interface EmployeeDetailViewProps {
  employee: {
    _id: string;
    applicationRef: string;
    status: EmployeeStatus;
    email: string;
    phone: string;
    employeeId?: string;
    temporaryEmployeeId?: string;
    personalDetails?: Record<string, unknown>;
    address?: Record<string, unknown>;
    education?: Record<string, unknown> | Record<string, unknown>[];
    references?: Record<string, unknown>[];
    familyDetails?: Record<string, unknown>[];
    nominee?: Record<string, unknown>;
    exServiceman?: Record<string, unknown>;
    gunman?: Record<string, unknown>;
    additionalDetails?: Record<string, unknown>;
    l1Decision?: {
      action: string;
      comment?: string;
      approvedByName?: string;
      decidedAt?: string;
      decidedBy?: { name?: string; email?: string } | null;
    };
    l2Decision?: {
      action: string;
      comment?: string;
      decidedAt?: string;
      decidedBy?: { name?: string; email?: string } | null;
    };
    scanningDecision?: {
      action: string;
      comment?: string;
      decidedAt?: string;
      decidedBy?: { name?: string; email?: string } | null;
    };
    scanningCompletedAt?: string;
    submittedAt?: string;
    submittedBy?: { name?: string; email?: string } | null;
    correctionNotes?: string;
    rejectionReason?: string;
    forwardedToSupportAt?: string;
    forwardedToAdminAt?: string;
    pendingFieldChanges?: Array<{
      path: string;
      label: string;
      oldValue: string;
      newValue: string;
    }>;
  };
  documents: PreviewDocument[];
  history: HistoryItem[];
  /** Defaults to L2 review; use "scanning" for Scanning staff. */
  reviewMode?: "l2" | "scanning";
}

/** Cards are skipped entirely when a section has nothing to show. */
function hasValues(data?: Record<string, unknown> | null): boolean {
  if (!data) return false;
  return Object.values(data).some((v) => v !== undefined && v !== null && v !== "");
}

function DetailSection({
  title,
  children,
  icon: Icon,
  className,
  id,
}: {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
  id?: string;
}) {
  return (
    <Card id={id} className={cn("scroll-mt-24 overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-[#F8FAFC] to-white">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1D4ED8]">
              <Icon className="h-4 w-4" />
            </span>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  const entries = flattenDisplayEntries(data);

  if (entries.length === 0) {
    return null;
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            {humanizeKey(key)}
          </dt>
          <dd className="mt-0.5 text-sm text-primary">
            {formatDisplayValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function EmployeeDetailView({
  employee,
  documents,
  history,
  reviewMode = "l2",
}: EmployeeDetailViewProps) {
  const personal = employee.personalDetails ?? {};
  const fullName = (personal.fullName as string) ?? "Unknown";
  const [status, setStatus] = useState(employee.status);
  const isScanning = reviewMode === "scanning";
  const exportScope = isScanning ? "scanning" : "l2";
  const reviewAnchor = isScanning ? "scanning-review" : "l2-review";

  useEffect(() => {
    setStatus(employee.status);
  }, [employee.status]);

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
              Employee summary
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
              {fullName}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">{employee.applicationRef}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <LiveBadge />
              {employee.temporaryEmployeeId && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                  <IdCard className="h-3.5 w-3.5" />
                  Temp ID: {employee.temporaryEmployeeId}
                </span>
              )}
              {employee.employeeId && (
                <span className="font-mono text-sm text-primary">
                  ID: {employee.employeeId}
                </span>
              )}
            </div>
            {(employee.submittedBy?.name || employee.submittedBy?.email) && (
              <p className="mt-2 text-xs text-[#475569]">
                Submitted by{" "}
                <span className="font-semibold text-[#0F172A]">
                  {employee.submittedBy.name ?? "Registration Submitter"}
                </span>
                {employee.submittedBy.email ? (
                  <>
                    {" "}
                    <span className="text-[#64748B]">({employee.submittedBy.email})</span>
                  </>
                ) : null}
              </p>
            )}
            <div className="mt-2">
              <ApprovalTimeline status={status} />
              {history.length > 0 && (
                <div className="mt-1.5">
                  {history.slice(-3).map((item, i) => (
                    <p key={i} className="text-[11px] text-[#64748B]">
                      {item.action.replace(/_/g, " ")}
                      {item.performedBy?.name ? ` · ${item.performedBy.name}` : ""}
                      {" · "}
                      {new Date(item.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { id: "l2-documents", label: "Documents" },
                { id: reviewAnchor, label: "Review" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jumpTo(item.id)}
                  className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#334155] transition hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <DownloadExcelButton
          scope={exportScope}
          employeeId={employee._id}
          label="Download Excel"
        />
      </div>

      <FieldChangesPanel changes={employee.pendingFieldChanges} />

      {(employee.correctionNotes || employee.rejectionReason) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="text-sm font-medium">
            {employee.rejectionReason ? "Reverse Note" : "Correction Notes"}
          </p>
          <p className="mt-1 text-sm">
            {employee.rejectionReason ?? employee.correctionNotes}
          </p>
        </div>
      )}

      {employee.l1Decision && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">
            {employee.l1Decision.action === "APPROVE"
              ? "L1 Approved by"
              : "L1 Decision"}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            {employee.l1Decision.approvedByName ||
              employee.l1Decision.decidedBy?.name ||
              employee.l1Decision.action}
            {employee.l1Decision.decidedAt
              ? ` — ${new Date(employee.l1Decision.decidedAt).toLocaleString("en-IN")}`
              : ""}
            {employee.l1Decision.comment && ` — ${employee.l1Decision.comment}`}
          </p>
        </div>
      )}

      {employee.l2Decision && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-sm font-medium text-sky-900">
            {employee.l2Decision.action === "APPROVE" ||
            employee.l2Decision.action === "FORWARD"
              ? "L2 Approved by"
              : "L2 Decision"}
          </p>
          <p className="mt-1 text-sm text-sky-800">
            {employee.l2Decision.decidedBy?.name || employee.l2Decision.action}
            {employee.l2Decision.decidedAt
              ? ` — ${new Date(employee.l2Decision.decidedAt).toLocaleString("en-IN")}`
              : ""}
            {employee.l2Decision.comment && ` — ${employee.l2Decision.comment}`}
          </p>
        </div>
      )}

      {employee.scanningDecision && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3">
          <p className="text-sm font-medium text-cyan-900">Scanning Completed by</p>
          <p className="mt-1 text-sm text-cyan-800">
            {employee.scanningDecision.decidedBy?.name || "Scanning"}
            {employee.scanningCompletedAt || employee.scanningDecision.decidedAt
              ? ` — ${new Date(
                  employee.scanningCompletedAt ?? employee.scanningDecision.decidedAt!
                ).toLocaleString("en-IN")}`
              : ""}
            {employee.scanningDecision.comment &&
              ` — ${employee.scanningDecision.comment}`}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Contact" icon={Contact}>
          <KeyValueGrid
            data={{
              email: employee.email,
              phone: employee.phone,
              submittedAt: employee.submittedAt
                ? new Date(employee.submittedAt).toLocaleString("en-IN")
                : undefined,
              submittedBy: employee.submittedBy
                ? [employee.submittedBy.name, employee.submittedBy.email]
                    .filter(Boolean)
                    .join(" · ")
                : undefined,
            }}
          />
        </DetailSection>

        <DetailSection title="Personal Details" icon={User}>
          <KeyValueGrid data={personal} />
        </DetailSection>

        {hasValues(employee.address) && (
          <DetailSection title="Address" icon={MapPin}>
            <KeyValueGrid data={employee.address as Record<string, unknown>} />
          </DetailSection>
        )}

        {hasValues(employee.nominee) && (
          <DetailSection title="Nominee" icon={HeartHandshake}>
            <KeyValueGrid data={employee.nominee!} />
          </DetailSection>
        )}

        {hasValues(employee.exServiceman) && (
          <DetailSection title="Ex Serviceman" icon={Shield}>
            <KeyValueGrid data={employee.exServiceman!} />
          </DetailSection>
        )}

        {hasValues(employee.gunman) && (
          <DetailSection title="Gunman" icon={Shield}>
            <KeyValueGrid data={employee.gunman!} />
          </DetailSection>
        )}

        {hasValues(employee.additionalDetails) && (
          <DetailSection title="Additional Details" icon={FileText}>
            <KeyValueGrid data={employee.additionalDetails!} />
          </DetailSection>
        )}
      </div>

      {employee.education && (
        <DetailSection title="Education" icon={GraduationCap}>
          {Array.isArray(employee.education) ? (
            <div className="space-y-4">
              {employee.education.map((edu, i) => (
                <KeyValueGrid key={i} data={edu} />
              ))}
            </div>
          ) : (
            <KeyValueGrid data={employee.education} />
          )}
        </DetailSection>
      )}

      {employee.references && employee.references.length > 0 && (
        <DetailSection title="References" icon={Users}>
          <div className="space-y-4">
            {employee.references.map((ref, i) => (
              <KeyValueGrid key={i} data={ref} />
            ))}
          </div>
        </DetailSection>
      )}

      {employee.familyDetails && employee.familyDetails.length > 0 && (
        <DetailSection title="Family Details" icon={Users}>
          <div className="space-y-4">
            {employee.familyDetails.map((member, i) => (
              <KeyValueGrid key={i} data={member} />
            ))}
          </div>
        </DetailSection>
      )}

      <DetailSection
        id="l2-documents"
        title={`Uploaded Documents${documents.length > 0 ? ` (${documents.length})` : ""}`}
        icon={FileText}
      >
        <p className="mb-3 text-sm text-[#64748B]">
          Use Preview to open a document, or Download to save a copy.
        </p>
        <DocumentPreviewGrid documents={documents} />
      </DetailSection>

      {(employee.temporaryEmployeeId ||
        status === EmployeeStatus.L2_REVIEW ||
        [
          EmployeeStatus.APPROVED,
          EmployeeStatus.ID_GENERATED,
          EmployeeStatus.SCANNING_COMPLETED,
          EmployeeStatus.ID_CARD_ISSUED,
        ].includes(status)) && (
        <EmployeeDocumentsFolderPanel
          employeeId={employee._id}
          showWhenEmpty={status === EmployeeStatus.L2_REVIEW}
        />
      )}

      <section
        id={reviewAnchor}
        className="mt-2 scroll-mt-24 space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <h3 className="font-heading text-lg font-semibold text-primary">
            {isScanning ? "Scanning Decision" : "Review Decision"}
          </h3>
          <p className="text-sm text-[#64748B]">
            {isScanning
              ? "Review previous approvals and registration details, then confirm scanning is complete."
              : "Review all employee details and documents above, then take action below."}
          </p>
        </div>
        {isScanning ? (
          <ScanningActionPanel
            employeeId={employee._id}
            status={status}
            scanningCompletedAt={employee.scanningCompletedAt}
            onStatusChange={setStatus}
          />
        ) : (
          <L2ActionPanel
            employeeId={employee._id}
            status={status}
            employeeIdCode={employee.temporaryEmployeeId ?? employee.employeeId}
            l1DecisionAction={employee.l1Decision?.action}
            l2DecisionAction={employee.l2Decision?.action}
            forwardedToSupportAt={employee.forwardedToSupportAt}
            forwardedToAdminAt={employee.forwardedToAdminAt}
            onStatusChange={setStatus}
          />
        )}
      </section>
    </div>
  );
}
