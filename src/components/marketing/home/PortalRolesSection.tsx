"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { PORTAL_ROLES } from "@/features/marketing/site-content";
import { MarketingIcon } from "@/components/marketing/MarketingIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PortalRolesSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4F9FC] py-16 lg:py-24">
      <div className="marketing-mesh absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.1),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284C7]">
            Who uses the portal
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-[#0B1F3A] md:text-4xl">
            Built for every role in the workflow
          </h2>
          <p className="mt-4 text-[#475569]">
            Each role gets a focused dashboard — queues, actions, Excel exports, and document
            folders that match their permissions. Staff sign in once from a single login page.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PORTAL_ROLES.map((portal, index) => (
            <motion.div
              key={portal.role}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="flex flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_12px_32px_-20px_rgba(11,31,58,0.35)]"
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg",
                  portal.accent
                )}
              >
                <MarketingIcon name={portal.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading font-semibold text-[#0B1F3A]">{portal.role}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#64748B]">
                {portal.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/staff/login">
            <Button variant="sky" size="lg" className="gap-2 rounded-full px-7">
              Open staff dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
