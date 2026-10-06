"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/l1/components/StatusBadge";
import { L1ActionPanel } from "@/features/l1/components/L1ActionPanel";
import { FieldChangesPanel } from "@/features/approval/components/FieldChangesPanel";
import { ApprovalTimeline } from "@/components/dashboard/ApprovalTimeline";
import { LiveBadge } from "@/components/dashboard/LiveBadge";
import {
  DocumentPreviewGrid,
  PreviewDocument,
} from "@/features/documents/components/DocumentPreviewGrid";
import { EmployeeStatus } from "@/types/enums";
import { Pencil, Undo2 } from "lucide-react";
import Link from "next/link";
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
    personalDetails?: Record<string, unknown>;
    address?: Record<string, unknown>;
    education?: Record<string, unknown> | Record<string, unknown>[];
    references?: Record<string, unknown>[];
    familyDetails?: Record<string, unknown>[];
    nominee?: Record<string, unknown>;
    exServiceman?: Record<string, unknown>;
    gunman?: Record<string, unknown>;
    additionalDetails?: Record<string, unknown>;
    declaration?: Record<string, unknown>;
    submittedAt?: string;
    submittedBy?: { name?: string; email?: string } | null;
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
    correctionNotes?: string;
    rejectionReason?: string;
    pendingFieldChanges?: Array<{
      path: string;
      label: string;
      oldValue: string;
      newValue: string;
    }>;
  };
  documents: PreviewDocument[];
  history: HistoryItem[];
}

/** Cards are skipped entirely when a section has nothing to show. */
function hasValues(data?: Record<string, unknown> | null): boolean {
  if (!data) return false;
  return Object.values(data).some((v) => v !== undefined && v !== null && v !== "");
}

function DetailSection({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
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
}: EmployeeDetailViewProps) {
  const personal = employee.personalDetails ?? {};
  const fullName = (personal.fullName as string) ?? "Unknown";
  const reversedFromL2 = employee.l2Decision?.action === "RETURN_TO_L1";
  const l2ReverseNote = reversedFromL2
    ? (employee.l2Decision?.comment ?? employee.correctionNotes)
    : undefined;
  const [status, setStatus] = useState(employee.status);

  useEffect(() => {
    setStatus(employee.status);
  }, [employee.status]);

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            {fullName}
          </h2>
          <p className="text-[#64748B]">{employee.applicationRef}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <LiveBadge />
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
              { id: "l1-contact", label: "Contact" },
              { id: "l1-documents", label: "Documents" },
              { id: "l1-review", label: "Review" },
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
        <div className="flex flex-wrap items-center gap-2">
          <DownloadExcelButton
            scope="l1"
            employeeId={employee._id}
            label="Download Excel"
          />
          {[
            EmployeeStatus.SUBMITTED,
            EmployeeStatus.L1_REVIEW,
            EmployeeStatus.L1_RETURNED,
            EmployeeStatus.L2_RETURNED,
          ].includes(status) && (
            <Link
              href={`/dashboard/l1/applications/${employee._id}/edit`}
              prefetch
              className="inline-flex h-9 items-center gap-2 rounded-md border border-primary px-3 text-sm font-medium text-primary hover:bg-primary/5"
            >
              <Pencil className="h-4 w-4" />
              Edit Details
            </Link>
          )}
        </div>
      </div>

      {reversedFromL2 && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <Undo2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Reversed from L2 — re-review required
            </p>
            {l2ReverseNote && (
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                {l2ReverseNote}
              </p>
            )}
            <p className="mt-1 text-xs text-amber-700">
              {employee.l2Decision?.decidedBy?.name
                ? `Sent back by ${employee.l2Decision.decidedBy.name}`
                : "Sent back by L2"}
              {employee.l2Decision?.decidedAt
                ? ` on ${new Date(employee.l2Decision.decidedAt).toLocaleString("en-IN")}`
                : ""}
            </p>
          </div>
        </div>
      )}

      <FieldChangesPanel changes={employee.pendingFieldChanges} />

      {employee.l1Decision?.action === "APPROVE" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">Approved by</p>
          <p className="mt-1 text-sm text-emerald-700">
            {employee.l1Decision.approvedByName ||
              employee.l1Decision.decidedBy?.name ||
              "L1"}
            {employee.l1Decision.decidedAt
              ? ` — ${new Date(employee.l1Decision.decidedAt).toLocaleString("en-IN")}`
              : ""}
          </p>
        </div>
      )}

      {!reversedFromL2 && (employee.correctionNotes || employee.rejectionReason) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="text-sm font-medium">
            {employee.rejectionReason ? "Reverse Note" : "Correction Notes"}
          </p>
          <p className="mt-1 text-sm">
            {employee.rejectionReason ?? employee.correctionNotes}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection id="l1-contact" title="Contact">
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

        <DetailSection title="Personal Details">
          <KeyValueGrid data={personal} />
        </DetailSection>

        {hasValues(employee.address) && (
          <DetailSection title="Address">
            <KeyValueGrid data={employee.address as Record<string, unknown>} />
          </DetailSection>
        )}

        {hasValues(employee.nominee) && (
          <DetailSection title="Nominee">
            <KeyValueGrid data={employee.nominee!} />
          </DetailSection>
        )}

        {hasValues(employee.exServiceman) && (
          <DetailSection title="Ex Serviceman">
            <KeyValueGrid data={employee.exServiceman!} />
          </DetailSection>
        )}

        {hasValues(employee.gunman) && (
          <DetailSection title="Gunman">
            <KeyValueGrid data={employee.gunman!} />
          </DetailSection>
        )}

        {hasValues(employee.additionalDetails) && (
          <DetailSection title="Additional Details">
            <KeyValueGrid data={employee.additionalDetails!} />
          </DetailSection>
        )}
      </div>

      {employee.education && (
        <DetailSection title="Education">
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
        <DetailSection title="References">
          <div className="space-y-4">
            {employee.references.map((ref, i) => (
              <KeyValueGrid key={i} data={ref} />
            ))}
          </div>
        </DetailSection>
      )}

      {employee.familyDetails && employee.familyDetails.length > 0 && (
        <DetailSection title="Family Details">
          <div className="space-y-4">
            {employee.familyDetails.map((member, i) => (
              <KeyValueGrid key={i} data={member} />
            ))}
          </div>
        </DetailSection>
      )}

      <DetailSection
        id="l1-documents"
        title={`Documents${documents.length > 0 ? ` (${documents.length})` : ""}`}
      >
        <p className="mb-3 text-sm text-[#64748B]">
          Use Preview to open a document, or Download to save a copy.
        </p>
        <DocumentPreviewGrid documents={documents} />
      </DetailSection>

      <section id="l1-review" className="mt-2 scroll-mt-24 space-y-3 border-t border-[#E2E8F0] pt-6">
        <div>
          <h3 className="font-heading text-lg font-semibold text-primary">
            Review Decision
          </h3>
          <p className="text-sm text-[#64748B]">
            Review all employee details and documents above, then take action below.
          </p>
        </div>
        <L1ActionPanel
          employeeId={employee._id}
          status={status}
          employeeIdCode={employee.employeeId}
          onStatusChange={setStatus}
        />
      </section>
    </div>
  );
}
