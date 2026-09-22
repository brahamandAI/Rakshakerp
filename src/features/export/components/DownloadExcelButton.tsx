"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadExcelButtonProps {
  scope: "l1" | "l2" | "admin";
  label?: string;
  /** When set, exports only this registration (Sampleempdetails format). */
  employeeId?: string;
}

interface PreviewData {
  count: number;
  columns: string[];
  rows: Record<string, string>[];
}

export function DownloadExcelButton({
  scope,
  label = "Download Excel",
  employeeId,
}: DownloadExcelButtonProps) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!preview) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreview(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [preview]);

  function apiUrl(preview = false) {
    const params = new URLSearchParams({ scope });
    if (preview) params.set("preview", "1");
    if (employeeId) params.set("id", employeeId);
    return `/api/export/registrations?${params.toString()}`;
  }

  async function loadPreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(true));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load preview");
      }
      const data = (await res.json()) as PreviewData;
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(false));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to download Excel");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ??
        (employeeId ? `empdetails-${scope}-one.xls` : `empdetails-${scope}.xls`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  const modal =
    preview && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-[#0B1F3A]/60 p-3 py-6 backdrop-blur-[2px] sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="excel-preview-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreview(null);
            }}
          >
            <div className="relative my-auto flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_32px_80px_-24px_rgba(11,31,58,0.55)] isolate">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white px-4 py-3 sm:px-5">
                <div>
                  <h3
                    id="excel-preview-title"
                    className="font-heading text-lg font-semibold text-primary"
                  >
                    Excel Preview
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Showing {preview.rows.length} of {preview.count} registration
                    {preview.count === 1 ? "" : "s"} · {preview.columns.length} columns
                    {employeeId
                      ? " (single registration)"
                      : scope === "admin"
                        ? " (L2 approved only)"
                        : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="accent"
                    onClick={handleDownload}
                    isLoading={loading}
                  >
                    <Download className="h-4 w-4" />
                    Download Full Excel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreview(null)}
                  >
                    <X className="h-4 w-4" />
                    Close
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
                {preview.count === 0 ? (
                  <p className="text-sm text-[#64748B]">No registrations to export.</p>
                ) : (
                  <table className="min-w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]">
                        {preview.columns.map((col) => (
                          <th
                            key={col}
                            className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-[#475569]"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-[#E2E8F0] odd:bg-white even:bg-[#F8FAFC]"
                        >
                          {preview.columns.map((col) => (
                            <td
                              key={col}
                              className="max-w-[220px] truncate px-2.5 py-2 text-[#0F172A]"
                              title={row[col]}
                            >
                              {row[col] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="mt-3 text-xs leading-relaxed text-[#64748B]">
                  Columns match the Sampleempdetails payroll Excel format (IDNO, address,
                  bank, ESI/PF, etc.). Scroll horizontally to review all {preview.columns.length}{" "}
                  columns.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="sky"
          size="sm"
          onClick={loadPreview}
          isLoading={previewLoading}
        >
          <Eye className="h-4 w-4" />
          Preview Excel
        </Button>
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={handleDownload}
          isLoading={loading}
        >
          <Download className="h-4 w-4" />
          {label}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {modal}
    </div>
  );
}
