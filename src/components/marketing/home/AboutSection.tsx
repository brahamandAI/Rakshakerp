import { cn } from "@/lib/utils";
import {
  ABOUT_CONTENT,
  COMPANY_HIGHLIGHTS,
  WHY_CHOOSE,
} from "@/features/marketing/site-content";
import { MotionReveal } from "@/components/marketing/MotionReveal";
import { MarketingIcon } from "@/components/marketing/MarketingIcon";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AboutPortalInfo } from "@/components/marketing/about/AboutPortalInfo";
import {
  Building2,
  Target,
  Eye,
  ListChecks,
  Sparkles,
  Layers,
} from "lucide-react";

export function AboutSection({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={cn(embedded ? "bg-white" : "scroll-mt-24 bg-white")}>
      {/* Intro */}
      <section className={cn(embedded ? "py-12 lg:py-16" : "py-20 lg:py-28")}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {!embedded && (
            <MotionReveal>
              <SectionHeading
                eyebrow="About Us"
                title={ABOUT_CONTENT.title}
                description={ABOUT_CONTENT.intro[0]}
              />
            </MotionReveal>
          )}

          <MotionReveal delay={embedded ? 0 : 80} className={cn(!embedded && "mt-10")}>
            <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white p-8 shadow-sm lg:p-10">
              <div className="flex items-start gap-4">
                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white sm:flex">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="space-y-4 text-sm leading-relaxed text-[#475569] lg:text-base">
                  {ABOUT_CONTENT.intro.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* Overview + Mission + Vision */}
      <section className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <MotionReveal>
            <div className="mb-8 flex items-center gap-3">
              <Layers className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-primary">Company Overview</h2>
            </div>
          </MotionReveal>

          <div className="grid gap-8 lg:grid-cols-3">
            <MotionReveal delay={60} className="lg:col-span-1">
              <div className="h-full rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-primary">Who We Are</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#64748B]">
                  {ABOUT_CONTENT.overview}
                </p>
              </div>
            </MotionReveal>

            <MotionReveal delay={100} className="lg:col-span-1">
              <div className="h-full rounded-2xl border border-primary/15 bg-gradient-to-br from-primary to-[#0a1f38] p-8 text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 font-heading text-sm font-semibold uppercase tracking-wider text-accent">
                  Mission
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  {ABOUT_CONTENT.mission}
                </p>
              </div>
            </MotionReveal>

            <MotionReveal delay={140} className="lg:col-span-1">
              <div className="h-full rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                  Vision
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                  {ABOUT_CONTENT.vision}
                </p>
              </div>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <MotionReveal>
            <SectionHeading
              eyebrow="Our Principles"
              title="Core Values"
              description="The principles that guide our operations, workforce management, and client relationships."
            />
          </MotionReveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT_CONTENT.values.map((value, i) => (
              <MotionReveal key={value.title} delay={i * 50}>
                <div className="group h-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <MarketingIcon name={value.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-heading font-semibold text-primary">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{value.description}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <MotionReveal>
            <div className="mb-8 flex items-center gap-3">
              <ListChecks className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-primary">Company Objectives</h2>
            </div>
          </MotionReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT_CONTENT.objectives.map((objective, i) => (
              <MotionReveal key={objective} delay={i * 40}>
                <div className="flex h-full items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-[#475569]">{objective}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <MotionReveal>
            <SectionHeading
              eyebrow="Why Rakshak"
              title="Why Choose Rakshak Securitas"
              description="Trusted security and facility management backed by disciplined operations and digital workforce systems."
            />
          </MotionReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE.map((item, i) => (
              <MotionReveal key={item.title} delay={i * 50}>
                <div className="group h-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <MarketingIcon name={item.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-heading font-semibold text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{item.description}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Company Highlights */}
      <section className="border-y border-[#E2E8F0] bg-gradient-to-br from-primary via-primary to-[#0a1f38] py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <MotionReveal>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-accent" />
              <h2 className="font-heading text-2xl font-bold">Company Highlights</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Digital capabilities that power modern employee onboarding at Rakshak Securitas.
            </p>
          </MotionReveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COMPANY_HIGHLIGHTS.map((item, i) => (
              <MotionReveal key={item.title} delay={i * 60}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <MarketingIcon name={item.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Information */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <MotionReveal>
            <SectionHeading
              eyebrow="EOMS Platform"
              title="Portal Information"
              description="Key metrics and workflow stages of the Employee Onboarding Management System."
            />
          </MotionReveal>

          <div className="mt-10">
            <AboutPortalInfo />
          </div>
        </div>
      </section>
    </div>
  );
}
