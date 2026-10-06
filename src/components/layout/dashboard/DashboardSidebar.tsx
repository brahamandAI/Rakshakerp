"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LucideIcon,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  FileOutput,
  Users,
  FolderOpen,
  Compass,
  Shield,
  ShieldCheck,
  UserPlus,
  Headphones,
  Crown,
  Undo2,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StaffRole, UserRole } from "@/types/enums";
import { getRoleLabel } from "@/lib/auth/permissions";
import { SidebarNotificationBadge } from "@/features/notifications/components/NotificationBell";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useDashboardChrome } from "@/components/layout/dashboard/DashboardChromeContext";
import { prefetchEmployeeFolders } from "@/features/documents/lib/folders-cache";
import { DeferredUnreadCount } from "@/components/dashboard/DeferredUnreadCount";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SUPPORT_NAV: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard/support", icon: LayoutDashboard },
      { label: "Registrations", href: "/dashboard/support/registrations", icon: FileOutput },
      { label: "Documents", href: "/dashboard/support/documents", icon: FolderOpen },
      { label: "Notifications", href: "/dashboard/support/notifications", icon: Bell },
    ],
  },
];

const ADMIN_NAV: NavSection[] = [
  {
    title: "Administration",
    items: [
      { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { label: "Users", href: "/dashboard/admin/users", icon: Users },
      {
        label: "Approved",
        href: "/dashboard/admin/registrations",
        icon: CheckCircle2,
      },
      { label: "Documents", href: "/dashboard/admin/documents", icon: FolderOpen },
      { label: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
    ],
  },
];

const NAV_ITEMS: Record<StaffRole, NavItem[] | NavSection[]> = {
  [UserRole.SUBMITTER]: [
    { label: "New Registration", href: "/dashboard/submitter?new=1", icon: LayoutDashboard },
    {
      label: "All Registrations",
      href: "/dashboard/submitter/registrations",
      icon: FileOutput,
    },
    {
      label: "Reversed",
      href: "/dashboard/submitter/registrations/reversed",
      icon: XCircle,
    },
    { label: "Documents", href: "/dashboard/submitter/documents", icon: FolderOpen },
    { label: "Notifications", href: "/dashboard/submitter/notifications", icon: Bell },
  ],
  [UserRole.L1]: [
    { label: "Dashboard", href: "/dashboard/l1", icon: LayoutDashboard },
    { label: "Pending", href: "/dashboard/l1/applications/pending", icon: Clock },
    {
      label: "Reversed from L2",
      href: "/dashboard/l1/applications/reversed-from-l2",
      icon: Undo2,
    },
    { label: "Approved", href: "/dashboard/l1/applications/approved", icon: CheckCircle2 },
    { label: "All Registrations", href: "/dashboard/l1/applications/all", icon: FileOutput },
    { label: "Reversed", href: "/dashboard/l1/applications/rejected", icon: XCircle },
    { label: "Notifications", href: "/dashboard/l1/notifications", icon: Bell },
  ],
  [UserRole.L2]: [
    { label: "Dashboard", href: "/dashboard/l2", icon: LayoutDashboard },
    { label: "Pending", href: "/dashboard/l2/applications/pending", icon: Clock },
    { label: "Approved", href: "/dashboard/l2/applications/approved", icon: CheckCircle2 },
    { label: "All Registrations", href: "/dashboard/l2/applications/all", icon: FileOutput },
    { label: "Reversed", href: "/dashboard/l2/applications/rejected", icon: XCircle },
    { label: "Documents", href: "/dashboard/l2/documents", icon: FolderOpen },
    { label: "Notifications", href: "/dashboard/l2/notifications", icon: Bell },
  ],
  [UserRole.SCANNING]: [
    { label: "Dashboard", href: "/dashboard/scanning", icon: LayoutDashboard },
    { label: "Pending", href: "/dashboard/scanning/applications/pending", icon: Clock },
    {
      label: "Approved / Scanning Completed",
      href: "/dashboard/scanning/applications/completed",
      icon: CheckCircle2,
    },
    { label: "All", href: "/dashboard/scanning/applications/all", icon: FileOutput },
    { label: "Documents", href: "/dashboard/scanning/documents", icon: FolderOpen },
    { label: "Notifications", href: "/dashboard/scanning/notifications", icon: Bell },
  ],
  [UserRole.SUPPORT]: SUPPORT_NAV,
  [UserRole.ADMIN]: ADMIN_NAV,
};

const SECTIONED_ROLES = new Set<StaffRole>([UserRole.SUPPORT, UserRole.ADMIN]);

const ROLE_BADGE: Record<StaffRole, { icon: LucideIcon; className: string }> = {
  [UserRole.SUBMITTER]: {
    icon: UserPlus,
    className:
      "border-sky-400/30 bg-gradient-to-r from-sky-500/25 to-blue-600/20 text-sky-200",
  },
  [UserRole.L1]: {
    icon: Shield,
    className:
      "border-indigo-400/30 bg-gradient-to-r from-indigo-500/25 to-violet-600/20 text-indigo-200",
  },
  [UserRole.L2]: {
    icon: ShieldCheck,
    className:
      "border-amber-400/35 bg-gradient-to-r from-amber-500/30 to-[#D4AF37]/20 text-amber-100",
  },
  [UserRole.SCANNING]: {
    icon: ScanLine,
    className:
      "border-cyan-400/30 bg-gradient-to-r from-cyan-500/25 to-sky-600/20 text-cyan-100",
  },
  [UserRole.SUPPORT]: {
    icon: Headphones,
    className:
      "border-teal-400/30 bg-gradient-to-r from-teal-500/25 to-cyan-600/20 text-teal-100",
  },
  [UserRole.ADMIN]: {
    icon: Crown,
    className:
      "border-violet-400/30 bg-gradient-to-r from-violet-500/25 to-fuchsia-600/15 text-violet-100",
  },
};

interface DashboardSidebarProps {
  role: StaffRole;
  unreadCountPromise: Promise<number>;
}

function isNavActive(pathname: string, href: string, role: StaffRole): boolean {
  const hrefPath = href.split("?")[0];
  const dashboardRoots: Record<StaffRole, string> = {
    [UserRole.SUBMITTER]: "/dashboard/submitter",
    [UserRole.L1]: "/dashboard/l1",
    [UserRole.L2]: "/dashboard/l2",
    [UserRole.SCANNING]: "/dashboard/scanning",
    [UserRole.SUPPORT]: "/dashboard/support",
    [UserRole.ADMIN]: "/dashboard/admin",
  };
  const root = dashboardRoots[role];
  if (hrefPath === root) return pathname === root;
  if (
    hrefPath.endsWith("/registrations") &&
    pathname.includes("/registrations/reversed")
  ) {
    return false;
  }
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

export function DashboardSidebar({ role, unreadCountPromise }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, desktopCollapsed, setCollapsed } = useDashboardChrome();
  const navConfig = NAV_ITEMS[role];
  const sections: NavSection[] = SECTIONED_ROLES.has(role)
    ? (navConfig as NavSection[])
    : [{ title: "Navigation", items: navConfig as NavItem[] }];

  const dashboardHome =
    role === UserRole.SUBMITTER
      ? "/dashboard/submitter"
      : role === UserRole.L1
        ? "/dashboard/l1"
        : role === UserRole.L2
          ? "/dashboard/l2"
          : role === UserRole.SCANNING
            ? "/dashboard/scanning"
            : role === UserRole.ADMIN
              ? "/dashboard/admin"
              : "/dashboard/support";

  const roleBadge = ROLE_BADGE[role];
  const RoleIcon = roleBadge.icon;

  function handleNavClick() {
    // Close mobile drawer after navigation
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }

  function prefetchNavItem(href: string) {
    router.prefetch(href);
    if (href.includes("/documents")) {
      void prefetchEmployeeFolders();
    }
  }

  useEffect(() => {
    for (const section of sections) {
      for (const item of section.items) {
        prefetchNavItem(item.href);
      }
    }
    // Prefetch once per role so switching users/roles still warms the new menu.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sections is derived from role
  }, [role]);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <button
          type="button"
          suppressHydrationWarning
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-[#0B1F3A]/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={cn(
          "relative z-50 flex h-full shrink-0 flex-col overflow-hidden text-white",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[18rem] max-lg:shadow-2xl max-lg:transition-transform max-lg:duration-300",
          collapsed ? "max-lg:-translate-x-full" : "max-lg:translate-x-0",
          "lg:static lg:translate-x-0 lg:transition-[width] lg:duration-200",
          desktopCollapsed ? "lg:w-[5rem]" : "lg:w-[18rem]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050D18] via-[#0A1A32] to-[#0E2748]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_20%_-10%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(ellipse_70%_40%_at_90%_5%,rgba(212,175,55,0.12),transparent_50%)]" />

        {/* Branding — original logo aspect ratio, no crop */}
        <div
          className={cn(
            "relative shrink-0 border-b border-white/[0.08]",
            desktopCollapsed ? "px-2 pb-3 pt-3" : "px-3.5 pb-4 pt-4"
          )}
        >
          <Link
            href={dashboardHome}
            onClick={handleNavClick}
            className={cn(
              "relative z-10 flex items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20",
              desktopCollapsed ? "justify-center px-1.5 py-2" : "px-2.5 py-2.5"
            )}
            aria-label="Rakshak Enrollment Portal home"
            title="Rakshak Enrollment Portal"
          >
            <BrandLogo
              href={null}
              variant="sidebar"
              priority
              className={desktopCollapsed ? "max-w-[52px]" : "w-full max-w-[248px]"}
            />
          </Link>

          <div className={cn("mt-3.5 px-0.5", desktopCollapsed && "hidden lg:hidden")}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                roleBadge.className,
                desktopCollapsed && "lg:hidden"
              )}
            >
              <RoleIcon className="h-3 w-3" />
              {getRoleLabel(role)}
            </span>
          </div>
          {desktopCollapsed && (
            <div className="mt-2 hidden justify-center lg:flex" title={getRoleLabel(role)}>
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                  roleBadge.className
                )}
              >
                <RoleIcon className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
        </div>

        <nav
          className={cn(
            "relative z-10 min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain py-4 scrollbar-none",
            desktopCollapsed ? "px-2" : "px-3"
          )}
        >
          {sections.map((section, idx) => (
            <div key={section.title ?? idx}>
              {section.title && (
                <div
                  className={cn(
                    "mb-2.5 flex items-center gap-2 px-2.5",
                    desktopCollapsed && "lg:justify-center lg:px-0"
                  )}
                >
                  <Compass className="h-3 w-3 text-white/35" />
                  <p
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80",
                        desktopCollapsed && "lg:hidden"
                      )}
                  >
                    {section.title}
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = isNavActive(pathname, item.href, role);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      onClick={handleNavClick}
                      onMouseEnter={() => prefetchNavItem(item.href)}
                      onFocus={() => prefetchNavItem(item.href)}
                      title={item.label}
                      className={cn(
                        "group relative z-10 flex min-h-11 items-center gap-3 rounded-xl py-2 text-[13px] font-semibold transition-colors duration-150",
                        desktopCollapsed ? "px-3 lg:justify-center lg:px-0" : "px-3",
                        isActive
                          ? "bg-white/[0.16] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                          : "text-white hover:bg-white/[0.1]"
                      )}
                    >
                      {isActive && (
                        <span
                          className={cn(
                            "absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gradient-to-b from-accent to-[#F5D76E]",
                            desktopCollapsed && "lg:left-1"
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition duration-200",
                          isActive
                            ? "bg-accent/20 text-accent"
                            : "bg-white/10 text-white group-hover:bg-white/15"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 whitespace-normal break-words leading-snug text-white",
                          desktopCollapsed && "lg:hidden"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.label === "Notifications" && (
                        <span className={cn(desktopCollapsed && "lg:absolute lg:right-1 lg:top-1")}>
                          <DeferredUnreadCount promise={unreadCountPromise}>
                            {(unreadCount) => (
                              <SidebarNotificationBadge unreadCount={unreadCount} />
                            )}
                          </DeferredUnreadCount>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
