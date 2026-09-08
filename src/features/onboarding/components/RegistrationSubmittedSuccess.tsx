"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegistrationSubmittedSuccessProps {
  applicationRef: string;
  employeeId?: string;
  submitterMode?: boolean;
  onContinueEditing?: () => void;
}

export function RegistrationSubmittedSuccess({
  applicationRef,
  employeeId,
  submitterMode = false,
  onContinueEditing,
}: RegistrationSubmittedSuccessProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!submitterMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [submitterMode]);

  const card = (
    <div className="relative w-full max-w-xl rounded-3xl border border-white/40 bg-white shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#4ADE80]" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-100/70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-blue-100/60 blur-2xl" />

      <div className="relative px-6 pb-8 pt-10 text-center sm:px-10 sm:pb-10 sm:pt-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-200 shadow-inner">
          <CheckCircle2 className="h-11 w-11 text-green-600" strokeWidth={2.25} />
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
          <Sparkles className="h-3.5 w-3.5" />
          Success
        </div>

        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[#14532D]">
          Registration Submitted
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#475569]">
          The employee registration has been submitted successfully and sent for
          L1 approval. You can still view and edit details, then submit again if needed.
        </p>

        <div className="mt-7 rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white px-5 py-4 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
              <FileText className="h-4 w-4 text-[#1D4ED8]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Application Reference
              </p>
              <p className="mt-1 break-all font-mono text-base font-semibold text-[#0F172A]">
                {applicationRef || "—"}
              </p>
              <p className="mt-2 text-xs text-[#64748B]">
                Status:{" "}
                <span className="font-semibold text-[#1D4ED8]">Pending L1 Approval</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-11 w-full whitespace-normal px-4 leading-snug sm:col-span-2"
            onClick={() => {
              window.location.assign(
                submitterMode ? "/dashboard/submitter" : "/apply"
              );
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {submitterMode ? (
            <>
              {employeeId && (
                <Button
                  className="h-11 w-full whitespace-normal bg-[#166534] px-4 leading-snug hover:bg-[#15803D]"
                  onClick={() => {
                    window.location.assign(
                      `/dashboard/submitter/registrations/${employeeId}`
                    );
                  }}
                >
                  View Status &amp; Details
                </Button>
              )}
              {onContinueEditing && (
                <Button
                  variant="outline"
                  className="h-11 w-full whitespace-normal px-4 leading-snug"
                  onClick={onContinueEditing}
                >
                  Continue Editing
                </Button>
              )}
              <Button
                variant="outline"
                className="h-11 w-full whitespace-normal px-4 leading-snug"
                onClick={() => {
                  window.location.assign("/dashboard/submitter/registrations");
                }}
              >
                All Registrations
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full whitespace-normal px-4 leading-snug"
                onClick={() => {
                  window.location.assign("/dashboard/submitter?new=1");
                }}
              >
                Register Another
              </Button>
            </>
          ) : (
            <Button
              className="h-11 w-full bg-[#166534] hover:bg-[#15803D] sm:col-span-2"
              onClick={() => {
                window.location.assign("/apply");
              }}
            >
              View Application Status
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (submitterMode) {
    if (!mounted) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#0B1F3A]/55 p-4 py-8 backdrop-blur-sm sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-submitted-title"
      >
        <div id="registration-submitted-title" className="sr-only">
          Registration Submitted
        </div>
        <div className="my-auto w-full max-w-xl">{card}</div>
      </div>,
      document.body
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center py-8">
      {card}
    </div>
  );
}
