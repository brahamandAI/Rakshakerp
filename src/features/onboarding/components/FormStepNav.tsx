"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_STEPS,
} from "@/features/onboarding/constants";

interface FormStepNavProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  trailing?: ReactNode;
}

export function FormStepNav({
  currentStep,
  completedSteps,
  onStepClick,
  trailing,
}: FormStepNavProps) {
  return (
    <nav aria-label="Form sections" className="bg-white">
      <div className="flex overflow-x-auto border-b border-[#E2E8F0] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ONBOARDING_STEPS.map((step) => {
          const done = completedSteps.includes(step.id);
          const active = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              suppressHydrationWarning
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-left text-xs transition-colors sm:px-3.5",
                active && "border-[#0B1F3A] text-[#0B1F3A]",
                !active && done && "border-transparent text-[#334155] hover:text-[#0B1F3A]",
                !active && !done && "border-transparent text-[#94A3B8] hover:text-[#64748B]"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  done && "bg-emerald-600 text-white",
                  active && !done && "bg-[#0B1F3A] text-white",
                  !active && !done && "bg-[#EEF2F7] text-[#64748B]"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : step.id}
              </span>
              <span className="hidden font-medium sm:inline">{step.shortLabel}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-medium text-[#64748B]">
          Section {currentStep} of {ONBOARDING_TOTAL_STEPS}:{" "}
          <span className="text-[#0B1F3A]">
            {ONBOARDING_STEPS[currentStep - 1]?.label}
          </span>
        </p>
        {trailing}
      </div>
    </nav>
  );
}
