"use client";

import { StaffSignInButton } from "@/features/auth/components/StaffSignInButton";

interface EmploymentFormLayoutProps {
  children: React.ReactNode;
  currentStep?: number;
  applicationRef?: string;
}

export function EmploymentFormLayout({
  children,
  applicationRef,
}: EmploymentFormLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F8FAFC]">
      <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-4">
          {applicationRef && (
            <p className="mr-auto font-mono text-xs font-semibold text-[#1D4ED8] sm:text-sm">
              {applicationRef}
            </p>
          )}
          <StaffSignInButton />
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
