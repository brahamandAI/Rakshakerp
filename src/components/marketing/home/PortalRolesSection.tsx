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
    <section className="relative overflow-hidden py-16 lg:py-24">
      <div className="marketing-mesh absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.12),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Who uses the portal
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-white md:text-4xl">
            Built for every role in the workflow
          </h2>
          <p className="mt-4 text-white/80">
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
              className="flex flex-col rounded-2xl border border-white/12 bg-white/8 p-6 shadow-soft backdrop-blur-md"
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg",
                  portal.accent
                )}
              >
                <MarketingIcon name={portal.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading font-semibold text-white">{portal.role}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/75">
                {portal.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/staff/login">
            <Button variant="accent" size="lg" className="gap-2">
              Staff Login
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
