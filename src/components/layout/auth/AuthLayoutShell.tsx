"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

export function AuthLayoutShell({
  children,
  title = "Sign In",
  showBackHome = true,
}: {
  children: React.ReactNode;
  /** @deprecated Kept for call-site compatibility */
  variant?: "employee" | "staff";
  title?: string;
  showBackHome?: boolean;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#EEF3F9] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(14,165,233,0.16),transparent_55%)]" />
      <div className="animate-auth-orb pointer-events-none absolute -left-10 top-[12%] h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="animate-auth-orb-slow pointer-events-none absolute -right-8 bottom-[10%] h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[42%] h-40 w-40 -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px] animate-rise">
        {showBackHome && (
          <div className="mb-5 animate-fade-in">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-[#D0DAE6] bg-white/90 px-3.5 py-2",
                "text-sm font-medium text-[#334155] shadow-sm backdrop-blur-sm",
                "transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:text-[#0B1F3A] hover:shadow-md"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </div>
        )}

        <div className="overflow-hidden rounded-[1.6rem] border border-[#DCE5F0] bg-white/95 shadow-[0_28px_70px_-34px_rgba(11,31,58,0.5)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_36px_80px_-32px_rgba(11,31,58,0.55)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0B1F3A] via-[#0EA5E9] to-[#D4AF37]" />

          <div className="px-7 pb-8 pt-7 sm:px-9 sm:pb-9 sm:pt-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="flex w-full justify-center rounded-2xl bg-white px-4 py-4 ring-1 ring-sky-100">
                <BrandLogo
                  href="/"
                  variant="dark"
                  priority
                  className="mx-auto max-w-[260px] justify-center"
                />
              </div>
              <h1 className="mt-6 font-heading text-[1.4rem] font-bold leading-snug tracking-tight text-[#0B1F3A] sm:text-[1.5rem]">
                {title}
              </h1>
              {title === "Sign In" && (
                <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-[#64748B]">
                  Use your staff credentials to open the dashboard for your role.
                </p>
              )}
              <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#D4AF37]" />
            </div>

            {children}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-center text-[11px] leading-relaxed text-[#94A3B8]">
            © {new Date().getFullYear()} Rakshak Securitas Pvt. Ltd.
          </p>
        </div>
      </div>
    </div>
  );
}
