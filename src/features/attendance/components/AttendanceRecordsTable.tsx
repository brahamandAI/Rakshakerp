"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Eye, Forward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { forwardAttendanceAction } from "@/features/attendance/actions/attendance.actions";
import { attendanceStatusClass } from "@/features/attendance/constants";
import type { AttendanceRow } from "@/lib/services/attendance.service";
import type { AttendanceViewer } from "@/features/attendance/constants";

interface ExecutiveOption {
  id: string;
  name: string;
}

export function AttendanceRecordsTable({
  records,
  viewer,
  detailBase,
  executives = [],
}: {
  records: AttendanceRow[];
  viewer: AttendanceViewer;
  detailBase: string;
  executives?: ExecutiveOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [forwarding, setForwarding] = useState<AttendanceRow | null>(null);
  const [executiveId, setExecutiveId] = useState("");
  const [isPending, startTransition] = useTransition();

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? records.filter((record) =>
        [
          record.fileName,
          record.submittedBy,
          record.receivedFrom,
          record.payrollManagerName,
          record.statusLabel,
          record.fileTypeLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    : records;

  function submitForward() {
    if (!forwarding || !executiveId) return;
    startTransition(async () => {
      const result = await forwardAttendanceAction({
        attendanceId: forwarding.id,
        payrollExecutiveId: executiveId,
      });
      if (!result.success) {
        toast({ title: "Unable to forward", description: result.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Attendance forwarded",
        description: "The selected Payroll Executive can now open this file.",
        variant: "success",
      });
      setForwarding(null);
      setExecutiveId("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search attendance"
        className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm sm:max-w-sm"
      />
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-4 py-3 text-left font-medium text-[#64748B]">S.No</th>
                {viewer === "manager" && (
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Submitted By</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-[#64748B]">File Name</th>
                {viewer !== "executive" && (
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">File Type</th>
                )}
                {viewer === "submitter" && (
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Payroll Manager</th>
                )}
                {viewer === "executive" && (
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Received From</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-[#64748B]">
                  {viewer === "executive" ? "Received Date" : "Uploaded Date"}
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#64748B]">Status</th>
                <th className="px-4 py-3 text-right font-medium text-[#64748B]">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#64748B]">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                visible.map((record) => (
                  <tr key={record.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-[#64748B]">{record.serial}</td>
                    {viewer === "manager" && (
                      <td className="px-4 py-3 font-medium text-primary">{record.submittedBy}</td>
                    )}
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-primary" title={record.fileName}>
                      {record.fileName}
                    </td>
                    {viewer !== "executive" && (
                      <td className="px-4 py-3">{record.fileTypeLabel}</td>
                    )}
                    {viewer === "submitter" && (
                      <td className="px-4 py-3">{record.payrollManagerName}</td>
                    )}
                    {viewer === "executive" && (
                      <td className="px-4 py-3">{record.receivedFrom}</td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-[#64748B]">{record.dateLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusClass(record.status)}`}>
                        {record.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        record={record}
                        detailBase={detailBase}
                        canForward={viewer === "manager"}
                        onForward={() => {
                          setExecutiveId("");
                          setForwarding(record);
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {visible.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#64748B]">No attendance records found.</p>
          ) : (
            visible.map((record) => (
              <article key={record.id} className="rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      #{record.serial}
                    </p>
                    <p className="mt-1 break-all font-heading font-semibold text-primary">
                      {record.fileName}
                    </p>
                    <p className="mt-1 text-sm text-[#334155]">
                      {viewer === "manager"
                        ? record.submittedBy
                        : viewer === "executive"
                          ? record.receivedFrom
                          : record.payrollManagerName}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {record.fileTypeLabel} · {record.dateLabel}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusClass(record.status)}`}>
                    {record.statusLabel}
                  </span>
                </div>
                <div className="mt-3">
                  <RowActions
                    record={record}
                    detailBase={detailBase}
                    canForward={viewer === "manager"}
                    onForward={() => {
                      setExecutiveId("");
                      setForwarding(record);
                    }}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {forwarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-heading text-lg font-semibold text-primary">Forward Attendance</h3>
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#F1F5F9]"
                onClick={() => setForwarding(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-[#64748B]">
              Attendance:{" "}
              <span className="font-semibold text-primary">{forwarding.fileName}</span>
            </p>
            <label className="mt-4 block space-y-2 text-sm font-medium text-[#334155]">
              Forward To
              <select
                className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm font-normal"
                value={executiveId}
                onChange={(event) => setExecutiveId(event.target.value)}
              >
                <option value="">Select Payroll Executive</option>
                {executives.map((executive) => (
                  <option key={executive.id} value={executive.id}>
                    {executive.name}
                  </option>
                ))}
              </select>
            </label>
            {executives.length === 0 && (
              <p className="mt-2 text-xs text-[#B45309]">
                No Payroll Executives are assigned to you yet.
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setForwarding(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitForward}
                disabled={isPending || !executiveId}
              >
                {isPending ? "Forwarding…" : "Forward Attendance"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({
  record,
  detailBase,
  canForward,
  onForward,
}: {
  record: AttendanceRow;
  detailBase: string;
  canForward: boolean;
  onForward: () => void;
}) {
  const actionClass =
    "inline-flex h-8 items-center justify-center gap-1 rounded-xl px-2.5 text-[11px] font-semibold";

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Link
        href={`${detailBase}/${record.id}`}
        className={cn(
          actionClass,
          "bg-gradient-to-r from-[#0EA5E9] to-[#1E90FF] text-white"
        )}
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </Link>
      <a
        href={`/api/attendance/${record.id}?mode=download`}
        className={cn(
          actionClass,
          "border border-sky-100 bg-white text-[#0B1F3A]"
        )}
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </a>
      {canForward && (
        <Button type="button" size="sm" className="h-8 px-2 text-[11px]" onClick={onForward}>
          <Forward className="h-3.5 w-3.5" />
          Forward
        </Button>
      )}
    </div>
  );
}
