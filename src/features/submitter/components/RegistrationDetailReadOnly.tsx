"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalStatusTimeline } from "@/features/submitter/components/ApprovalStatusTimeline";
import type { ApprovalTimelineItem } from "@/features/submitter/components/ApprovalStatusTimeline";
import { ApprovalTimeline } from "@/components/dashboard/ApprovalTimeline";
import { EmployeeDocumentsFolderPanel } from "@/features/documents/components/EmployeeDocumentsFolderPanel";
import { StatusBadge } from "@/features/l1/components/StatusBadge";
import { EmployeeStatus } from "@/types/enums";
import { FileText } from "lucide-react";
import {
  flattenDisplayEntries,
  formatDisplayValue,
  humanizeKey,
} from "@/lib/utils/display-value";

interface RegistrationDetailReadOnlyProps {
  employeeId?: string;
  employee: {
    applicationRef: string;
    status: string;
    temporaryEmployeeId?: string;
    personalDetails?: Record<string, unknown>;
    address?: Record<string, unknown>;
    education?: Record<string, unknown> | Record<string, unknown>[];
    references?: Record<string, unknown>[];
    familyDetails?: Record<string, unknown>[];
    nominee?: Record<string, unknown>;
    additionalDetails?: Record<string, unknown>;
    exServiceman?: Record<string, unknown>;
    gunman?: Record<string, unknown>;
    rejectionReason?: string;
    correctionNotes?: string;
    submittedBy?: { name?: string; email?: string } | null;
  };
  documents: Array<{ documentType: string; fileName: string; url: string }>;
  history?: ApprovalTimelineItem[];
  /** Show employee documents folder panel after L2 approval */
  showDocumentsFolder?: boolean;
}

function Grid({ title, data }: { title: string; data?: Record<string, unknown> }) {
  if (!data) return null;
  const entries = flattenDisplayEntries(data);
  if (entries.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {entries.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase text-[#64748B]">
                {humanizeKey(k)}
              </dt>
              <dd className="text-sm text-[#0F172A]">{formatDisplayValue(v)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function RegistrationDetailReadOnly({
  employeeId,
  employee,
  documents,
  history = [],
  showDocumentsFolder = false,
}: RegistrationDetailReadOnlyProps) {
  const statusValue = (
    Object.values(EmployeeStatus) as string[]
  ).includes(employee.status)
    ? (employee.status as EmployeeStatus)
    : EmployeeStatus.SUBMITTED;

  return (
    <div className="space-y-4 animate-fade-in">
      {showDocumentsFolder && employeeId && (
        <EmployeeDocumentsFolderPanel employeeId={employeeId} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={statusValue} />
            {employee.temporaryEmployeeId && (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800">
                Temp ID: {employee.temporaryEmployeeId}
              </span>
            )}
          </div>
          <ApprovalTimeline status={statusValue} />
          {(employee.submittedBy?.name || employee.submittedBy?.email) && (
            <p className="text-xs text-[#475569]">
              Submitted by{" "}
              <span className="font-semibold text-[#0F172A]">
                {employee.submittedBy.name ?? "Registration Submitter"}
              </span>
              {employee.submittedBy.email ? (
                <span className="text-[#64748B]"> ({employee.submittedBy.email})</span>
              ) : null}
            </p>
          )}
          {history.length > 0 && (
            <ApprovalStatusTimeline history={history} currentStatus={employee.status} />
          )}
          <p>
            <span className="font-medium text-[#64748B]">Application Ref:</span>{" "}
            <span className="font-semibold text-primary">{employee.applicationRef}</span>
          </p>
          {employee.rejectionReason && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
              <span className="font-medium">Rejection Comment:</span> {employee.rejectionReason}
            </p>
          )}
          {employee.correctionNotes && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              <span className="font-medium">Reverse Note:</span> {employee.correctionNotes}
            </p>
          )}
        </CardContent>
      </Card>

      <Grid title="Employee Information" data={employee.personalDetails} />
      <Grid title="Address" data={employee.address} />
      <Grid
        title="Education"
        data={(employee.education as Record<string, unknown>) ?? {}}
      />
      <Grid title="Nominee Information" data={employee.nominee} />
      <Grid title="Bank & Additional Information" data={employee.additionalDetails} />
      <Grid title="Ex-Serviceman Details" data={employee.exServiceman} />
      <Grid title="Gunman Details" data={employee.gunman} />

      {employee.references && employee.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.references.map((ref, i) => (
              <dl key={i} className="grid gap-3 border-b border-[#E2E8F0] pb-3 last:border-0 sm:grid-cols-2">
                {Object.entries(ref).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase text-[#64748B]">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="text-sm">{String(v ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </CardContent>
        </Card>
      )}

      {employee.familyDetails && employee.familyDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Family Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.familyDetails.map((member, i) => (
              <dl key={i} className="grid gap-3 border-b border-[#E2E8F0] pb-3 last:border-0 sm:grid-cols-2">
                {Object.entries(member).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase text-[#64748B]">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="text-sm">{String(v ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-[#1D4ED8]" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.map((doc) => (
              <a
                key={`${doc.documentType}-${doc.fileName}`}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-[#F8FAFC]"
              >
                {doc.documentType}: {doc.fileName}
              </a>
            ))}
            {documents.length === 0 && (
              <p className="text-sm text-[#64748B]">No documents available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
