"use client";

import { motion } from "framer-motion";
import { PLATFORM_FEATURES } from "@/features/marketing/site-content";
import { MarketingIcon } from "@/components/marketing/MarketingIcon";
import { cn } from "@/lib/utils";

export function PlatformFeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 lg:py-24">
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Employee Onboarding System
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl">
            Everything You Need to Hire & Onboard
          </h2>
          <p className="mt-4 text-[#64748B]">
            Registration, document capture, L1/L2 decisions, Temporary Employee ID, and
            Employee Documents folders — in one secure system.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07, duration: 0.45 }}
              className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={cn(
                  "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                  feature.color
                )}
              >
                <MarketingIcon name={feature.icon} className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-primary">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{feature.description}</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
