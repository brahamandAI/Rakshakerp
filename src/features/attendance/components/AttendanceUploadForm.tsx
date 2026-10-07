"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  ATTENDANCE_ACCEPT,
  ATTENDANCE_MAX_BYTES,
} from "@/features/attendance/constants";

interface PayrollManagerOption {
  id: string;
  name: string;
}

const ALLOWED = new Set(["xlsx", "xls", "pdf", "doc", "docx"]);

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
}

export function AttendanceUploadForm({
  managers,
}: {
  managers: PayrollManagerOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [managerId, setManagerId] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = managers.find((manager) => manager.id === managerId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!managerId || !selected) {
      toast({
        title: "Payroll Manager required",
        description: "Select the Payroll Manager who should receive this attendance.",
        variant: "destructive",
      });
      return;
    }
    if (!file) {
      toast({
        title: "File required",
        description: "Select an Excel, PDF, or Word attendance file.",
        variant: "destructive",
      });
      return;
    }
    if (!ALLOWED.has(extensionOf(file.name)) || file.size > ATTENDANCE_MAX_BYTES) {
      toast({
        title: "Invalid file",
        description: "Use .xlsx, .xls, .pdf, .doc, or .docx up to 5 MB.",
        variant: "destructive",
      });
      return;
    }

    const body = new FormData();
    body.set("payrollManagerId", managerId);
    body.set("file", file);
    setSubmitting(true);
    try {
      const response = await fetch("/api/attendance", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; payrollManagerName?: string }
        | null;
      if (!response.ok) {
        toast({
          title: "Upload failed",
          description: payload?.error ?? "Unable to upload attendance.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Attendance submitted",
        description: `Sent to ${payload?.payrollManagerName ?? selected.name}.`,
        variant: "success",
      });
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      toast({
        title: "Upload failed",
        description: "Unable to upload attendance.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        New attendance
      </p>
      <h3 className="mt-1 font-heading text-lg font-semibold text-primary">
        Upload attendance
      </h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Payroll Manager</Label>
          <select
            className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm"
            value={managerId}
            onChange={(event) => setManagerId(event.target.value)}
            required
          >
            <option value="">Select Payroll Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
          {managers.length === 0 && (
            <p className="text-xs text-[#B45309]">
              No Payroll Managers are available yet.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Attendance file</Label>
          <input
            ref={fileRef}
            type="file"
            accept={ATTENDANCE_ACCEPT}
            required
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            className="block h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#334155] file:mr-3 file:rounded-lg file:border-0 file:bg-[#EFF6FF] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#1D4ED8]"
          />
          <p className="text-xs text-[#64748B]">Excel, PDF, or Word. Maximum 5 MB.</p>
        </div>
      </div>
      {selected && (
        <p className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#334155]">
          Submitting to{" "}
          <span className="font-semibold text-primary">{selected.name}</span>
          {fileName ? (
            <>
              {" "}
              · <span className="font-medium">{fileName}</span>
            </>
          ) : null}
        </p>
      )}
      <div className="mt-5">
        <Button type="submit" disabled={submitting || managers.length === 0}>
          <Upload className="h-4 w-4" />
          {submitting ? "Uploading…" : "Submit attendance"}
        </Button>
      </div>
    </form>
  );
}
