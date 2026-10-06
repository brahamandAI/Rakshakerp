"use client";

import { useMarketingSection } from "@/features/marketing/context/MarketingSectionProvider";
import { SectionBanner } from "@/components/marketing/SectionBanner";
import { HeroSection } from "@/components/marketing/home/HeroSection";
import { HomeApplicationOverview } from "@/components/marketing/home/HomeApplicationOverview";
import { PlatformFeaturesSection } from "@/components/marketing/home/PlatformFeaturesSection";
import { StatsSection } from "@/components/marketing/home/StatsSection";
import { AboutSection } from "@/components/marketing/home/AboutSection";
import { ServicesShowcase } from "@/components/marketing/home/ServicesShowcase";
import { FAQSection } from "@/components/marketing/home/FAQSection";
import { ContactSection } from "@/components/marketing/home/ContactSection";
import { PortalRolesSection } from "@/components/marketing/home/PortalRolesSection";
import { CTABanner } from "@/components/marketing/CTABanner";

export function MarketingPage() {
  const { section } = useMarketingSection();

  if (section === "about") {
    return (
      <>
        <SectionBanner sectionId="about" />
        <AboutSection embedded />
      </>
    );
  }

  if (section === "services") {
    return <ServicesShowcase />;
  }

  if (section === "faq") {
    return (
      <>
        <SectionBanner sectionId="faq" />
        <FAQSection embedded />
      </>
    );
  }

  if (section === "contact") {
    return <ContactSection />;
  }

  return (
    <>
      <HeroSection />
      <StatsSection />
      <HomeApplicationOverview />
      <PlatformFeaturesSection />
      <PortalRolesSection />
      <CTABanner
        title="Ready to continue onboarding?"
        description="Sign in to your role dashboard to register employees, review applications, generate Temporary Employee IDs, and manage document folders."
        primaryHref="/staff/login"
        primaryLabel="Open staff dashboard"
        secondaryHref="/?section=contact"
        secondaryLabel="Contact us"
      />
    </>
  );
}
