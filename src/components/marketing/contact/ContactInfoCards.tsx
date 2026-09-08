import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/components/marketing/MotionReveal";
import {
  CORPORATE_OFFICE,
  HR_CONTACT,
  WORKING_HOURS,
  getMapUrls,
} from "@/features/marketing/contact-content";

export function ContactInfoCards() {
  const mapUrls = getMapUrls(CORPORATE_OFFICE.mapQuery);

  return (
    <section id="contact-info" className="scroll-mt-32 bg-[#F8FAFC] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <MotionReveal delay={0}>
            <article className="flex h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg lg:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <MapPin className="h-6 w-6 text-accent" aria-hidden />
              </div>
              <h2 className="mt-5 font-heading text-lg font-bold text-primary">
                {CORPORATE_OFFICE.title}
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-accent">
                {CORPORATE_OFFICE.subtitle}
              </p>
              <address className="mt-4 space-y-1 not-italic text-sm leading-relaxed text-[#64748B]">
                {CORPORATE_OFFICE.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <div className="mt-6 pt-2">
                <Link href={mapUrls.open} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    View on Google Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </article>
          </MotionReveal>

          <MotionReveal delay={60}>
            <article className="flex h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg lg:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Phone className="h-6 w-6 text-accent" aria-hidden />
              </div>
              <h2 className="mt-5 font-heading text-lg font-bold text-primary">
                {HR_CONTACT.title}
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-accent">
                {HR_CONTACT.subtitle}
              </p>
              <ul className="mt-5 space-y-4 text-sm text-[#64748B]">
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Phone
                    </p>
                    <a
                      href={`tel:${HR_CONTACT.mobile.replace(/\s/g, "")}`}
                      className="mt-0.5 block hover:text-primary"
                    >
                      {HR_CONTACT.mobile}
                    </a>
                    <a
                      href={`tel:${HR_CONTACT.office.replace(/-/g, "")}`}
                      className="block hover:text-primary"
                    >
                      {HR_CONTACT.office}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Recruitment Email
                    </p>
                    <a
                      href={`mailto:${HR_CONTACT.recruitmentEmail}`}
                      className="mt-0.5 block hover:text-primary"
                    >
                      {HR_CONTACT.recruitmentEmail}
                    </a>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      General Email
                    </p>
                    <a
                      href={`mailto:${HR_CONTACT.generalEmail}`}
                      className="mt-0.5 block hover:text-primary"
                    >
                      {HR_CONTACT.generalEmail}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Website
                    </p>
                    <a
                      href={HR_CONTACT.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block hover:text-primary"
                    >
                      {HR_CONTACT.website}
                    </a>
                  </div>
                </li>
              </ul>
            </article>
          </MotionReveal>

          <MotionReveal delay={120}>
            <article className="flex h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg lg:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Clock className="h-6 w-6 text-accent" aria-hidden />
              </div>
              <h2 className="mt-5 font-heading text-lg font-bold text-primary">
                Working Hours
              </h2>
              <ul className="mt-5 space-y-2">
                {WORKING_HOURS.map((item) => (
                  <li
                    key={item.day}
                    className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-primary">{item.day}</span>
                    <span
                      className={
                        item.closed ? "font-medium text-red-600" : "text-[#64748B]"
                      }
                    >
                      {item.hours}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
