"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LogIn, UserPlus, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/components/marketing/MotionReveal";
import { CONTACT_PAGE } from "@/features/marketing/contact-content";

export function ContactHero() {
  return (
    <section className="relative min-h-[420px] overflow-hidden pt-24 lg:min-h-[480px] lg:pt-28">
      <Image
        src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
        alt="Corporate office and HR recruitment support"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/88 to-primary/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,_rgba(212,175,55,0.18)_0%,_transparent_55%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F4F9FC] to-transparent" />

      <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 lg:px-8 lg:py-20">
        <MotionReveal>
          <span className="inline-flex w-fit rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            Employee Onboarding Support
          </span>
          <h1 className="mt-5 max-w-3xl font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {CONTACT_PAGE.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/85 lg:text-lg">
            {CONTACT_PAGE.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="#contact-form">
              <Button variant="accent" size="lg" className="gap-2">
                <Headphones className="h-4 w-4" />
                Contact HR
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" />
                Employee Login
              </Button>
            </Link>
            <Link href="/apply">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                <UserPlus className="h-4 w-4" />
                Start Registration
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
