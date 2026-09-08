"use client";

import {
  Check,
  Circle,
  FileText,
  Mail,
  Phone,
  User,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_STEPS,
  DOCUMENT_LABELS,
  getRequiredDocuments,
} from "@/features/onboarding/constants";
import { DocumentRecord } from "@/features/onboarding/types";

const STEP_HINTS: Record<number, string> = {
  1: "Fill personal details, address, education, and employment preferences accurately as per your documents.",
  2: "Provide two non-relative references with full name, contact number, and address.",
  3: "Add family members for ESIC records. Use Add Member to include more rows.",
  4: "Nominee details are mandatory for EPF and insurance nomination.",
  5: "Ex-Serviceman and Gunman sections apply only if relevant to your role.",
  6: "Upload clear scans of all required documents. PDF, JPG, or PNG up to 5 MB each.",
  7: "Read the declaration carefully, accept terms, and submit your application.",
};

interface OnboardingSidebarProps {
  currentStep: number;
  completedSteps: number[];
  applicationRef: string;
  applicantName?: string;
  email: string;
  phone: string;
  documents: DocumentRecord[];
  onStepClick?: (step: number) => void;
  isExServiceman?: boolean;
  isGunman?: boolean;
}

export function OnboardingSidebar({
  currentStep,
  completedSteps,
  applicationRef,
  applicantName,
  email,
  phone,
  documents,
  onStepClick,
  isExServiceman = false,
  isGunman = false,
}: OnboardingSidebarProps) {
  const progress = Math.round((completedSteps.length / ONBOARDING_TOTAL_STEPS) * 100);
  const uploadedTypes = new Set(documents.map((d) => d.documentType));
  const checklistDocs = getRequiredDocuments({ isExServiceman, isGunman });

  return (
    <aside className="flex h-full flex-col bg-primary text-white">
      <div className="border-b border-white/10 bg-black px-3 py-3">
        <BrandLogo href="/apply" variant="sidebar" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Applicant
          </p>
          <div className="mt-3 space-y-2.5">
            <InfoRow icon={User} label="Name" value={applicantName || "—"} />
            <InfoRow icon={FileText} label="Reference" value={applicationRef} mono />
            <InfoRow icon={Mail} label="Email" value={email} />
            <InfoRow icon={Phone} label="Mobile" value={phone} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-white/80">Progress</span>
            <span className="font-bold text-accent">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        </div>

        <nav aria-label="Form steps">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/50">
            Form Sections
          </p>
          <ol className="space-y-1">
            {ONBOARDING_STEPS.map((step) => {
              const done = completedSteps.includes(step.id);
              const active = step.id === currentStep;
              const clickable = Boolean(onStepClick);
              const handleClick = () => {
                if (onStepClick) onStepClick(step.id);
              };

              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={handleClick}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      active && "bg-white/10 text-accent",
                      !active && done && "text-white/90 hover:bg-white/5",
                      !active && !done && "text-white/50 hover:bg-white/5",
                      clickable && "cursor-pointer"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        done && "bg-green-500 text-white",
                        active && !done && "bg-accent text-primary",
                        !active && !done && "border border-white/20 bg-white/5"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : step.id}
                    </span>
                    <span className="leading-tight">
                      <span className="block font-medium">{step.label}</span>
                      {active && (
                        <span className="text-[10px] text-white/50">In progress</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {currentStep === 6 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              Document Checklist
            </p>
            <ul className="mt-3 space-y-2">
              {checklistDocs.map((type) => {
                const uploaded = uploadedTypes.has(type);
                return (
                  <li key={type} className="flex items-center gap-2 text-xs">
                    {uploaded ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-white/30" />
                    )}
                    <span className={uploaded ? "text-white/90" : "text-white/50"}>
                      {DOCUMENT_LABELS[type]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-accent/20 bg-accent/10 p-4">
          <div className="flex gap-2">
            <HelpCircle className="h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="text-xs font-semibold text-accent">Step Guide</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                {STEP_HINTS[currentStep]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="text-center text-[10px] text-white/40">
          Auto-saves as you type · Fields marked * are required
        </p>
      </div>
    </aside>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[10px] text-white/50">{label}</p>
        <p className={cn("truncate text-xs font-medium text-white", mono && "font-mono")}>
          {value}
        </p>
      </div>
    </div>
  );
}
