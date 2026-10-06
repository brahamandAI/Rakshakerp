"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeStatus } from "@/types/enums";
import { scanningCompleteAction } from "@/features/scanning/actions/scanning.actions";

interface ScanningActionPanelProps {
  employeeId: string;
  status: EmployeeStatus;
  scanningCompletedAt?: string;
  onStatusChange?: (status: EmployeeStatus) => void;
}

export function ScanningActionPanel({
  employeeId,
  status,
  scanningCompletedAt,
  onStatusChange,
}: ScanningActionPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanningChecked, setScanningChecked] = useState(false);
  const [completed, setCompleted] = useState(!!scanningCompletedAt);

  const canReview =
    !completed &&
    !scanningCompletedAt &&
    (status === EmployeeStatus.APPROVED || status === EmployeeStatus.ID_GENERATED);

  async function submitComplete() {
    if (busy || completed) return;
    if (!scanningChecked) {
      setError('Please check "Scanning Completed" before approving.');
      return;
    }
    setError(null);
    setBusy(true);
    setCompleted(true);
    setSuccess("Marked as Scanning Completed.");
    onStatusChange?.(EmployeeStatus.SCANNING_COMPLETED);

    const fd = new FormData();
    fd.set("employeeId", employeeId);
    fd.set("scanningCompleted", "true");
    if (comment.trim()) fd.set("comment", comment.trim());

    try {
      const result = await scanningCompleteAction(fd);
      if (!result.success) {
        setCompleted(false);
        setSuccess(null);
        setError(result.error ?? "Action failed");
        onStatusChange?.(status);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setCompleted(false);
      setSuccess(null);
      setError("Unable to complete scanning. Please try again.");
      onStatusChange?.(status);
    } finally {
      setBusy(false);
    }
  }

  if (completed || scanningCompletedAt || status === EmployeeStatus.SCANNING_COMPLETED) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scanning Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold">Scanning Completed</p>
              <p className="mt-1 text-emerald-800">
                This registration has been marked scanning completed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canReview) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scanning Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#64748B]">
          Review the registration details from previous approvals, then confirm scanning
          is complete.
        </p>

        <Checkbox
          id="scanningCompleted"
          label="Scanning Completed"
          checked={scanningChecked}
          onChange={(e) => {
            setScanningChecked(e.target.checked);
            if (e.target.checked) setError(null);
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="scanning-comment">Comment (optional)</Label>
          <Textarea
            id="scanning-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any notes about the scanning review"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        )}

        <Button
          type="button"
          variant="accent"
          className="w-full sm:w-auto"
          disabled={busy || !scanningChecked}
          isLoading={busy}
          onClick={() => void submitComplete()}
        >
          <CheckCircle className="h-4 w-4" />
          Approved / Scanning Completed
        </Button>
      </CardContent>
    </Card>
  );
}
