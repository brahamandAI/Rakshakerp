"use client";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { getSectionMeta, MarketingSectionId } from "@/features/marketing/sections";

export function SectionBanner({ sectionId }: { sectionId: MarketingSectionId }) {
  const meta = getSectionMeta(sectionId);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1F3A] via-[#12325C] to-[#0F766E] pt-24 lg:pt-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,_rgba(56,189,248,0.28)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_90%,_rgba(45,212,191,0.18)_0%,_transparent_45%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F4F9FC] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-16">
        <SectionHeading
          light
          align="left"
          eyebrow={meta.eyebrow}
          title={meta.title}
          description={meta.description}
        />
      </div>
    </section>
  );
}
