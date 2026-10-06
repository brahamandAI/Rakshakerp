"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { StaffSignInButton } from "@/features/auth/components/StaffSignInButton";
import { useMarketingSection } from "@/features/marketing/context/MarketingSectionProvider";
import { MarketingSectionId, sectionHref } from "@/features/marketing/sections";

export function MarketingNavbar() {
  const { section, setSection, sections, isHomePage } = useMarketingSection();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSectionClick(id: MarketingSectionId) {
    setSection(id);
    setMobileOpen(false);
  }

  const activeSection = isHomePage ? section : null;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || !isHomePage || section !== "home"
          ? "border-b border-[#E2E8F0] bg-white/95 shadow-md backdrop-blur-md"
          : "bg-white/90 shadow-sm backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 lg:h-[5rem] lg:px-8">
        <BrandLogo
          href="/"
          variant="dark"
          priority
          className="max-w-[240px] transition-transform duration-200 hover:scale-[1.02] sm:max-w-[280px] lg:max-w-[340px]"
          onClick={(e) => {
            if (isHomePage) {
              e.preventDefault();
              handleSectionClick("home");
            }
          }}
        />

        <nav className="hidden items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] p-1 lg:flex">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSectionClick(item.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                activeSection === item.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-[#475569] hover:-translate-y-px hover:bg-white hover:text-primary hover:shadow-sm"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <StaffSignInButton variant="sky" className="rounded-full" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSectionClick("contact")}
            className="rounded-full"
          >
            Contact us
          </Button>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-[#1E293B] transition-colors hover:bg-[#F8FAFC] lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E2E8F0] bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSectionClick(item.id)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-[#EFF6FF] text-[#1D4ED8]"
                    : "text-[#334155] hover:bg-[#F8FAFC]"
                )}
              >
                {item.label}
              </button>
            ))}
            <StaffSignInButton
              className="w-full"
              onOpen={() => setMobileOpen(false)}
            />
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingNavbarFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 lg:h-[4.75rem] lg:px-8">
        <BrandLogo href={sectionHref("home")} variant="dark" />
      </div>
    </header>
  );
}
