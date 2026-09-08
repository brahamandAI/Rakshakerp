"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQ_ITEMS } from "@/features/marketing/site-content";
import { MotionReveal } from "@/components/marketing/MotionReveal";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";

export function FAQSection({ embedded = false }: { embedded?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={cn(embedded ? "bg-white py-12 lg:py-16" : "scroll-mt-24 bg-white py-20 lg:py-28")}>
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        {!embedded && (
          <MotionReveal>
            <SectionHeading
              align="center"
              eyebrow="FAQ"
              title="Frequently Asked Questions"
              description="Common questions about joining, documents, and onboarding."
            />
          </MotionReveal>
        )}
        <div className={cn(embedded ? "space-y-3" : "mt-10 space-y-3")}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <MotionReveal key={item.question} delay={i * 50}>
                <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] transition-all duration-200 hover:border-sky-200 hover:bg-white hover:shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-heading text-sm font-semibold text-primary">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-primary transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="border-t border-[#E2E8F0] px-5 py-4 text-sm leading-relaxed text-[#64748B]">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </MotionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
