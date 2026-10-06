"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/components/marketing/MotionReveal";
import { SERVICES_PAGE } from "@/features/marketing/services-content";

export function ServicesHero() {
  return (
    <section className="relative min-h-[420px] overflow-hidden pt-24 lg:min-h-[480px] lg:pt-28">
      <Image
        src="https://images.unsplash.com/photo-1557597774-9d273622cd0d?auto=format&fit=crop&w=1920&q=80"
        alt="Professional security services"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,_rgba(212,175,55,0.18)_0%,_transparent_55%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F4F9FC] to-transparent" />

      <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 lg:px-8 lg:py-20">
        <MotionReveal>
          <span className="inline-flex w-fit rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            {SERVICES_PAGE.title}
          </span>
          <h1 className="mt-5 max-w-3xl font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {SERVICES_PAGE.subtitle}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/85 lg:text-lg">
            {SERVICES_PAGE.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/?section=contact">
              <Button variant="accent" size="lg" className="gap-2">
                Request Service
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/apply">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                Employee Registration
              </Button>
            </Link>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
