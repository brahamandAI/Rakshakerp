"use client";

import { DashboardChromeProvider } from "@/components/layout/dashboard/DashboardChromeContext";
import { DashboardSidebar } from "@/components/layout/dashboard/DashboardSidebar";
import { ProfileMenu } from "@/components/layout/dashboard/ProfileMenu";
import { DashboardLiveRefresh } from "@/components/dashboard/DashboardLiveRefresh";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { DeferredUnreadCount } from "@/components/dashboard/DeferredUnreadCount";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { getRoleLabel } from "@/lib/auth/permissions";
import { StaffRole } from "@/types/enums";
import { PanelLeft } from "lucide-react";
import { useDashboardChrome } from "@/components/layout/dashboard/DashboardChromeContext";
import { usePathname } from "next/navigation";

interface DashboardFrameProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: StaffRole;
  };
  unreadCountPromise: Promise<number>;
  notificationsHref: string;
  homeHref: string;
  profileHref: string;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Overview",
  pending: "Pending",
  approved: "Approved",
  rejected: "Reversed",
  reversed: "Reversed",
  "reversed-from-l2": "Reversed from L2",
  all: "All Registrations",
  registrations: "Registrations",
  applications: "Applications",
  documents: "Documents",
  notifications: "Notifications",
  profile: "Profile",
  users: "Users",
  edit: "Edit",
  generate: "Generate ID Card",
  "pending-l1": "Pending L1",
  "pending-l2": "Pending L2",
};

function currentPageTitle(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 2) return "Overview";
  const last = parts[parts.length - 1];
  if (/^[a-f0-9]{24}$/i.test(last)) return "Details";
  return (
    PAGE_TITLES[last] ??
    last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function DashboardHeader({
  user,
  unreadCountPromise,
  notificationsHref,
  homeHref,
  profileHref,
}: Omit<DashboardFrameProps, "children">) {
  const { collapsed, desktopCollapsed, setCollapsed, toggleDesktop } =
    useDashboardChrome();
  const pathname = usePathname();
  const pageTitle = currentPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:min-h-16 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => {
              if (window.innerWidth >= 1024) {
                toggleDesktop();
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#475569] transition-all duration-200 hover:-translate-y-px hover:border-sky-200 hover:bg-[#EFF6FF] hover:text-[#1D4ED8] hover:shadow-sm"
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <BrandLogo
            href={homeHref}
            variant="dark"
            className="mt-0.5 max-w-[140px] sm:max-w-[180px] lg:hidden"
          />
          <div className="hidden min-w-0 lg:block">
            <div className="flex h-9 flex-wrap items-center gap-2">
              <h1 className="font-heading text-base font-semibold leading-snug text-primary">
                {pageTitle}
              </h1>
              <span className="inline-flex h-5 items-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 text-[10px] font-semibold uppercase leading-none tracking-wide text-[#64748B]">
                {getRoleLabel(user.role)}
              </span>
            </div>
            <DashboardBreadcrumbs homeHref={homeHref} className="mt-1" />
          </div>
          <DashboardLiveRefresh role={user.role} className="mt-0.5 hidden h-9 sm:inline-flex" />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <DeferredUnreadCount promise={unreadCountPromise}>
            {(unreadCount) => (
              <NotificationBell href={notificationsHref} unreadCount={unreadCount} />
            )}
          </DeferredUnreadCount>
          <ProfileMenu
            userName={user.name}
            userEmail={user.email}
            role={user.role}
            profileHref={profileHref}
          />
        </div>
      </div>
      <div className="border-t border-[#F1F5F9] px-4 py-2 lg:hidden">
        <p className="mb-1 font-heading text-sm font-semibold leading-snug text-primary">{pageTitle}</p>
        <DashboardBreadcrumbs homeHref={homeHref} />
      </div>
    </header>
  );
}

export function DashboardFrame(props: DashboardFrameProps) {
  const { children, user, unreadCountPromise, homeHref, profileHref, ...headerProps } =
    props;

  return (
    <DashboardChromeProvider>
      <div className="dashboard-shell-bg flex h-dvh overflow-hidden">
        <DashboardSidebar role={user.role} unreadCountPromise={unreadCountPromise} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F9FC]">
          <DashboardHeader
            user={user}
            unreadCountPromise={unreadCountPromise}
            homeHref={homeHref}
            profileHref={profileHref}
            {...headerProps}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-5 lg:p-6">
            <div className="w-full min-w-0 max-w-none animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </DashboardChromeProvider>
  );
}
