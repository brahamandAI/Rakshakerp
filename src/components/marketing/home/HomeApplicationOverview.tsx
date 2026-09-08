"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  FolderOpen,
  Info,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  REQUIRED_DOCUMENTS,
} from "@/features/marketing/site-content";
import { MarketingIcon } from "@/components/marketing/MarketingIcon";
import { Button } from "@/components/ui/button";
import { StaffWorkflowCard } from "@/components/marketing/home/StaffWorkflowCard";

const FORM_STEPS = [
  { step: 1, title: "Applicant Details", detail: "Branch, client, personal & contact information" },
  { step: 2, title: "References", detail: "Two non-relative references" },
  { step: 3, title: "Family Details", detail: "Family members for records" },
  { step: 4, title: "Nominee", detail: "EPF / insurance nomination" },
  { step: 5, title: "Additional Particulars", detail: "Ex-serviceman / gunman when applicable" },
  { step: 6, title: "Documents", detail: "Photo, Aadhaar, PAN, bank proof & certificates" },
  { step: 7, title: "Declaration", detail: "Live signature and submit for L1" },
];

const KEY_POINTS = [
  "Registration Submitters create and manage multiple employee registrations from their dashboard.",
  "Each registration has 7 guided sections with document uploads — edit anytime before final approval.",
  "L1 reviews and either approves to L2 or reverses with a note for the submitter to correct.",
  "L2 gives final approval (Temp Employee ID), can send back to L1, or reverse to the submitter.",
  "After L2 approval, all uploaded files are organized under Employee Documents / TEMP ID - Name.",
  "Admin and Support access approved registrations and document folders based on their permissions.",
];

export function HomeApplicationOverview() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 bg-[#F4F7FB] py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            How the portal works
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl">
            From registration to Employee Documents
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#64748B]">
            A clear staff workflow: submit → L1 verify → L2 approve → Temporary Employee ID →
            organized document folder for every employee.
          </p>
        </div>

        <div className="mt-12">
          <StaffWorkflowCard />
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="marketing-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-primary">Registration form</h3>
                <p className="text-sm text-[#64748B]">7 sections completed by the Submitter</p>
              </div>
            </div>
            <ol className="mt-6 space-y-2.5">
              {FORM_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="flex gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 transition hover:border-sky-200 hover:bg-white"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-primary">{item.title}</p>
                    <p className="text-xs text-[#64748B]">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1F3A] via-[#12325C] to-[#0F766E] p-6 text-white shadow-soft lg:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20">
                <Info className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold">What happens next</h3>
                <p className="text-sm text-white/60">Current process in this portal</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {KEY_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-white/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/staff/login">
                <Button variant="accent" className="gap-2">
                  Open staff portal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="marketing-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-primary">Documents to prepare</h3>
                <p className="text-sm text-[#64748B]">Uploaded in the Documents step of registration</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {REQUIRED_DOCUMENTS.map((doc) => (
                <div
                  key={doc.title}
                  className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 transition hover:border-sky-200 hover:bg-white"
                >
                  <MarketingIcon name={doc.icon} className="h-4 w-4 shrink-0 text-sky-600" />
                  <span className="text-sm font-medium text-primary">{doc.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="marketing-card bg-gradient-to-br from-sky-50 to-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-primary">Employee Documents</h3>
                <p className="text-sm text-[#64748B]">Created after L2 approval</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-sky-100 bg-white/80 p-4 font-mono text-xs leading-relaxed text-[#334155]">
              <p className="font-semibold text-primary">Employee Documents/</p>
              <p className="mt-1 pl-3">TEMP0001 - Rahul Kumar/</p>
              <p className="pl-6 text-[#64748B]">Photo · Aadhaar · PAN · Bank…</p>
              <p className="mt-1 pl-3">TEMP0002 - Ravi Sharma/</p>
              <p className="pl-6 text-[#64748B]">All uploaded documents</p>
            </div>
            <p className="mt-4 text-sm text-[#64748B]">
              Open Folder on any approved registration to view and download files according to your role.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
