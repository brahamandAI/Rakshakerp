"use client";

import { MapPin, Phone, Mail } from "lucide-react";
import { ABOUT_CONTENT, COMPANY_HIGHLIGHTS, SITE } from "@/features/marketing/site-content";
import { MarketingIcon } from "@/components/marketing/MarketingIcon";
import { MotionReveal } from "@/components/marketing/MotionReveal";

export function HomePortalInfoSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <MotionReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              About this portal
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl">
              Digital onboarding for Rakshak Securitas
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#475569] lg:text-base">
              {ABOUT_CONTENT.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </MotionReveal>

          <MotionReveal delay={80}>
            <div className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-sm sm:p-8">
              <h3 className="font-heading text-lg font-semibold text-primary">
                {SITE.legalName}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{SITE.tagline}</p>
              <ul className="mt-6 space-y-4 text-sm text-[#334155]">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="leading-relaxed">{SITE.address}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    {SITE.phone}
                    <br />
                    {SITE.officePhone}
                  </span>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    {SITE.email}
                    <br />
                    {SITE.generalEmail}
                  </span>
                </li>
              </ul>
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
                {SITE.officeHours}
              </p>
            </div>
          </MotionReveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANY_HIGHLIGHTS.map((item, i) => (
            <MotionReveal key={item.title} delay={i * 40}>
              <article className="h-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary">
                  <MarketingIcon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-heading font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{item.description}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
