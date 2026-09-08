"use client";

import { motion } from "framer-motion";
import { RECRUITMENT_STEPS } from "@/features/marketing/site-content";
import { MarketingIcon } from "@/components/marketing/MarketingIcon";

export function StaffWorkflowCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-[#0B1F3A] via-[#12325C] to-[#0F2748] p-6 shadow-[0_30px_80px_-40px_rgba(11,31,58,0.55)] sm:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-accent/15 blur-3xl" />

      <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
        Staff workflow
      </p>
      <h3 className="relative mt-2 font-heading text-2xl font-bold leading-snug text-white">
        Registration to Employee Documents
      </h3>
      <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
        The same six-step path your staff follow inside the portal — from the first
        registration through Temporary Employee ID and organized document folders.
      </p>

      <ol className="relative mt-6 grid gap-3 md:grid-cols-2">
        {RECRUITMENT_STEPS.map((step) => (
          <li
            key={step.step}
            className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/10"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-xs font-bold text-accent">
              {step.step}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <MarketingIcon name={step.icon} className="h-3.5 w-3.5 shrink-0 text-sky-200" />
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}
