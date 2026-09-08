"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  submitter: "Submitter",
  l1: "L1 Approver",
  l2: "L2 Approver",
  admin: "Admin",
  support: "Support",
  applications: "Applications",
  registrations: "Registrations",
  pending: "Pending",
  approved: "Approved",
  rejected: "Reversed",
  reversed: "Reversed",
  "reversed-from-l2": "Reversed from L2",
  all: "All",
  documents: "Documents",
  notifications: "Notifications",
  profile: "Profile",
  users: "Users",
  edit: "Edit",
  "id-cards": "ID Cards",
  generate: "Generate",
};

function humanize(segment: string) {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment];
  if (/^[a-f0-9]{24}$/i.test(segment)) return "Details";
  return segment
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function DashboardBreadcrumbs({
  homeHref,
  className,
}: {
  homeHref: string;
  className?: string;
}) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length <= 2) {
    return null;
  }

  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    if (i === 0) continue;
    crumbs.push({ href: acc, label: humanize(parts[i]) });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1 text-xs text-[#64748B]",
        className
      )}
    >
      <Link
        href={homeHref}
        className="inline-flex h-4 items-center gap-1 rounded-md px-1 leading-none transition hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
      >
        <Home className="relative top-px h-3.5 w-3.5 shrink-0" />
        <span className="sr-only sm:not-sr-only leading-none">Home</span>
      </Link>
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.href} className="inline-flex h-4 min-w-0 items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0 text-[#CBD5E1]" />
            {isLast ? (
              <span className="font-semibold leading-snug text-primary">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-md px-1 py-0.5 leading-snug transition hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
