import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTABannerProps {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function CTABanner({
  title = "Ready to continue onboarding?",
  description = "Sign in to register employees, review applications, and manage document folders from your role dashboard.",
  primaryHref = "/staff/login",
  primaryLabel = "Open staff dashboard",
  secondaryHref = "/?section=contact",
  secondaryLabel = "Contact us",
}: CTABannerProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1F3A] via-[#12325C] to-[#0F766E] py-20">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 animate-float rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 animate-float rounded-full bg-teal-300/20 blur-3xl [animation-delay:1.4s]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(14,165,233,0.2)_0%,_transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href={primaryHref}>
            <Button variant="sky" size="lg" className="gap-2 rounded-full px-7">
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={secondaryHref}>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full border-white/40 bg-white text-[#0B1F3A] hover:bg-sky-50"
            >
              {secondaryLabel}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
