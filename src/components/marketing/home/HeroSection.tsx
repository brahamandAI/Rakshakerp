"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  FolderOpen,
  Shield,
  Users,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/features/marketing/site-content";
import { useMarketingSection } from "@/features/marketing/context/MarketingSectionProvider";

const HIGHLIGHTS = [
  { icon: CheckCircle2, label: "Employee Registration", tone: "bg-sky-500" },
  { icon: FolderOpen, label: "Document Upload", tone: "bg-emerald-500" },
  { icon: Users, label: "Multi-Level Approvals", tone: "bg-violet-500" },
  { icon: Shield, label: "Secure & Compliant", tone: "bg-amber-500" },
  { icon: BarChart3, label: "Reports & Insights", tone: "bg-pink-500" },
];

export function HeroSection() {
  const { setSection } = useMarketingSection();

  function scrollToHowItWorks() {
    const target = document.getElementById("how-it-works");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSection("about");
  }

  return (
    <section className="relative overflow-hidden bg-white pt-16 lg:pt-[4.5rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_10%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(ellipse_40%_35%_at_90%_80%,rgba(45,212,191,0.12),transparent_50%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:px-8 lg:py-16">
        {/* Left — site copy + CTAs */}
        <div className="relative z-10 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#64748B]">
            SIMPLIFY · STREAMLINE · EMPOWER
          </p>

          <h1 className="mt-3 font-heading text-4xl font-bold leading-[1.12] tracking-tight text-[#0B1F3A] sm:text-5xl">
            Enrollment{" "}
            <span className="bg-gradient-to-r from-[#0EA5E9] to-[#14B8A6] bg-clip-text text-transparent">
              Portal
            </span>
          </h1>

          <p className="mt-3 text-base font-medium text-[#334155] sm:text-lg">
            Onboard | Verify | Approve | Manage — All in One Place
          </p>

          <p className="mt-4 text-sm leading-relaxed text-[#64748B] sm:text-[0.95rem]">
            {SITE.intro}
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {HIGHLIGHTS.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-3 py-2 text-xs font-medium text-[#0B1F3A] shadow-sm sm:text-sm"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${item.tone}`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/staff/login">
              <Button
                variant="sky"
                size="lg"
                className="gap-2 rounded-full px-7 shadow-[0_12px_28px_-12px_rgba(14,165,233,0.65)]"
              >
                Staff Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={scrollToHowItWorks}
              className="rounded-full border-sky-100 px-7"
            >
              How it works
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => setSection("contact")}
              className="rounded-full border-sky-200 px-7 text-[#0284C7] hover:border-sky-300 hover:bg-sky-50"
            >
              Contact
            </Button>
          </div>

          <div className="mt-7 inline-flex max-w-full items-center gap-3 rounded-full border border-sky-100 bg-sky-50/90 px-4 py-2.5 text-sm font-medium text-[#0B1F3A]">
            <Users className="h-4 w-4 shrink-0 text-[#0284C7]" />
            <span>A Smarter Way to Build Your Workforce</span>
          </div>
        </div>

        {/* Right — image only, soft rounded, blends with background */}
        <div className="relative z-10 mx-auto w-full max-w-[560px] overflow-hidden rounded-3xl lg:mx-0 lg:max-w-[580px] lg:justify-self-end">
          <Image
            src="/marketing/enrollment-hero-visual.jpg"
            alt="Enrollment portal — onboard, verify, approve, and manage"
            width={1024}
            height={576}
            priority
            sizes="(max-width: 1024px) min(92vw, 560px), 580px"
            className="h-auto w-full rounded-3xl object-contain object-center"
          />
        </div>
      </div>
    </section>
  );
}
