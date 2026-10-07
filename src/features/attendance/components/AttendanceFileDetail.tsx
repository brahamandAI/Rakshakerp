import { Download } from "lucide-react";
import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";
import { attendanceStatusClass } from "@/features/attendance/constants";

export function AttendanceFileDetail({
  backHref,
  fileName,
  fileTypeLabel,
  status,
  statusLabel,
  submittedBy,
  payrollManagerName,
  payrollExecutiveName,
  uploadedAtLabel,
  forwardedAtLabel,
  canPreview,
  fileId,
  showSubmitter,
}: {
  backHref: string;
  fileName: string;
  fileTypeLabel: string;
  status: string;
  statusLabel: string;
  submittedBy: string;
  payrollManagerName: string;
  payrollExecutiveName?: string;
  uploadedAtLabel: string;
  forwardedAtLabel?: string;
  canPreview: boolean;
  fileId: string;
  showSubmitter: boolean;
}) {
  return (
    <div className="space-y-6">
      <DashboardBackLink href={backHref} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-all font-heading text-2xl font-bold text-primary">{fileName}</h2>
          <p className="mt-1 text-sm text-[#64748B]">{fileTypeLabel}</p>
        </div>
        <a
          href={`/api/attendance/${fileId}?mode=download`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white px-4 text-sm font-semibold text-[#0B1F3A] shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:grid-cols-2">
        {showSubmitter && (
          <DetailItem label="Submitted by" value={submittedBy} />
        )}
        <DetailItem label="Payroll Manager" value={payrollManagerName} />
        {payrollExecutiveName ? (
          <DetailItem label="Payroll Executive" value={payrollExecutiveName} />
        ) : null}
        <DetailItem label="Uploaded" value={uploadedAtLabel} />
        {forwardedAtLabel ? (
          <DetailItem label="Forwarded" value={forwardedAtLabel} />
        ) : null}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Status</p>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusClass(status)}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {canPreview ? (
        <iframe
          title={fileName}
          src={`/api/attendance/${fileId}?embed=1`}
          className="h-[70vh] w-full rounded-2xl border border-[#E2E8F0] bg-white shadow-sm"
        />
      ) : (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">
          This {fileTypeLabel} file cannot be previewed in the browser. Download keeps the original file name and format.
          <div className="mt-4">
            <a
              href={`/api/attendance/${fileId}?mode=download`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0B1F3A] px-4 text-sm font-semibold text-white"
            >
              Download original file
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-1 text-sm font-medium text-primary">{value}</p>
    </div>
  );
}
