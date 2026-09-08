"use client";

import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Clock,
} from "lucide-react";
import { SITE, SOCIAL_LINKS } from "@/features/marketing/site-content";
import { MARKETING_SECTIONS } from "@/features/marketing/sections";
import { useMarketingSection } from "@/features/marketing/context/MarketingSectionProvider";
import { HR_CONTACT } from "@/features/marketing/contact-content";
import { RakshakBrandMark } from "@/components/brand/RakshakBrandMark";
import { PoweredByRobustrix } from "@/components/brand/PoweredByRobustrix";

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
};

export function MarketingFooter() {
  const { setSection } = useMarketingSection();

  return (
    <footer className="border-t border-white/10 bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <button
              type="button"
              onClick={() => setSection("home")}
              className="block w-full max-w-[300px] text-left sm:max-w-[340px]"
            >
              <RakshakBrandMark variant="light" />
            </button>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon] ?? Linkedin;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-white/10 hover:text-accent"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setSection("home")}
                  className="text-sm text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white"
                >
                  Home
                </button>
              </li>
              {MARKETING_SECTIONS.filter((s) => s.id !== "home").map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => setSection(link.id)}
                    className="text-sm text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-sm text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white">
                  Employee Login
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-sm text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white">
                  Employee Registration
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white">
                  Application Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent">
              Contact Information
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Corporate Office
                </p>
                <p className="mt-1 flex items-start gap-2 text-sm text-white/70">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    T-5, Plot No.12
                    <br />
                    Manish Plaza-III
                    <br />
                    Sector-10, Dwarka
                    <br />
                    New Delhi – 110075
                  </span>
                </p>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  {HR_CONTACT.mobile}
                  <br />
                  {HR_CONTACT.office}
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  {HR_CONTACT.recruitmentEmail}
                  <br />
                  {HR_CONTACT.generalEmail}
                </span>
              </li>
              <li>
                <a
                  href={HR_CONTACT.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {HR_CONTACT.website}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent">
              Office Hours
            </h3>
            <div className="mt-4 flex items-start gap-2 text-sm text-white/70">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <p>Monday – Saturday</p>
                <p className="mt-1 font-medium text-white">9:00 AM – 6:00 PM</p>
                <p className="mt-3 text-white/50">Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 border-t border-white/10 pt-7 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <p className="text-center text-[11px] leading-relaxed text-white/45 lg:text-left">
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex justify-center">
            <PoweredByRobustrix tone="dark" />
          </div>
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-white/45 lg:justify-end"
          >
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <span className="hidden text-white/20 sm:inline" aria-hidden>
              |
            </span>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms &amp; Conditions
            </Link>
            <span className="hidden text-white/20 sm:inline" aria-hidden>
              |
            </span>
            <button
              type="button"
              onClick={() => setSection("faq")}
              className="transition-colors hover:text-white"
            >
              FAQ
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
