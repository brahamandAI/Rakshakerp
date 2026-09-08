"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FolderOpen, Shield, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/features/marketing/site-content";
import { useMarketingSection } from "@/features/marketing/context/MarketingSectionProvider";

const HIGHLIGHTS = [
  { icon: CheckCircle2, label: "Digital Registration" },
  { icon: Shield, label: "Secure Approvals" },
  { icon: FolderOpen, label: "Employee Documents" },
  { icon: Users, label: "Role-Based Access" },
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
    <section className="relative min-h-[90vh] overflow-hidden pt-16 lg:pt-[4.5rem]">
      <Image
        src={SITE.heroImage}
        alt=""
        fill
        priority
        className="object-cover opacity-20"
        aria-hidden
      />
      <div className="marketing-mesh absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,#F4F7FB_100%)]" />

      <div className="pointer-events-none absolute left-[8%] top-[22%] h-44 w-44 animate-float rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[10%] top-[28%] h-56 w-56 animate-float rounded-full bg-accent/20 blur-3xl [animation-delay:1.2s]" />
      <div className="pointer-events-none absolute bottom-[24%] left-[42%] h-40 w-40 animate-float rounded-full bg-teal-500/15 blur-3xl [animation-delay:2s]" />

      <div className="relative mx-auto grid min-h-[calc(90vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="animate-fade-in text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
            Rakshak Securitas · Employee Onboarding Portal
          </p>

          <h1 className="mt-5 animate-fade-in font-heading text-4xl font-bold leading-[1.12] tracking-tight text-white stagger-1 sm:text-5xl lg:text-[3.25rem]">
            {SITE.legalName}
          </h1>

          <p className="mt-4 max-w-2xl animate-fade-in font-heading text-xl font-semibold leading-snug text-sky-100/95 stagger-2 sm:text-2xl">
            {SITE.tagline}
          </p>

          <p className="mt-5 max-w-xl animate-fade-in text-base leading-relaxed text-white/80 stagger-3 lg:text-lg">
            {SITE.intro}
          </p>

          <div className="mt-8 flex animate-fade-in flex-wrap gap-2.5 stagger-4">
            {HIGHLIGHTS.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm text-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/20"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                {item.label}
              </span>
            ))}
          </div>

          <div className="mt-10 flex animate-fade-in flex-wrap gap-3 stagger-5">
            <Link href="/staff/login">
              <Button variant="accent" size="lg" className="gap-2">
                Staff Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={scrollToHowItWorks}
            >
              How it works
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => setSection("contact")}
              className="border-white/45 bg-transparent text-white hover:border-white hover:bg-white/15 hover:text-white"
            >
              Contact
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl animate-rise lg:mx-0 lg:max-w-none">
          <div className="pointer-events-none absolute -inset-6 rounded-[2.2rem] bg-gradient-to-br from-sky-400/30 via-transparent to-accent/25 blur-2xl" />
          <figure className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
            <Image
              src="/marketing/how-it-works-hero.jpg"
              alt="How employee onboarding works: registration, L1 and L2 approvals, Temporary Employee ID, and document folders"
              width={1152}
              height={864}
              priority
              quality={90}
              sizes="(max-width: 1024px) 90vw, 520px"
              className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071526]/80 via-transparent to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                How it works
              </p>
              <p className="mt-1 font-heading text-lg font-semibold leading-snug text-white">
                Register · Approve · Issue ID · File documents
              </p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
