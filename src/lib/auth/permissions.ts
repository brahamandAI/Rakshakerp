import { UserRole, StaffRole, STAFF_ROLES } from "@/types/enums";

export function isStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function getRoleLabel(role: UserRole | StaffRole): string {
  const labels: Record<string, string> = {
    [UserRole.EMPLOYEE]: "Employee",
    [UserRole.SUBMITTER]: "Registration Submitter",
    [UserRole.L1]: "L1 Approver",
    [UserRole.L2]: "L2 Approver",
    [UserRole.SCANNING]: "Scanning",
    [UserRole.SUPPORT]: "Support",
    [UserRole.ADMIN]: "Super Admin",
    [UserRole.PAYROLL_MANAGER]: "Payroll Manager",
    [UserRole.PAYROLL_EXECUTIVE]: "Payroll Executive",
  };
  return labels[role] ?? role;
}

export function canAccessRoute(role: StaffRole, pathname: string): boolean {
  const allowedPaths: Record<StaffRole, string[]> = {
    [UserRole.SUBMITTER]: [
      "/dashboard/submitter",
      "/dashboard/submitter/registrations",
      "/dashboard/submitter/documents",
      "/dashboard/submitter/attendance",
      "/dashboard/submitter/notifications",
      "/dashboard/submitter/profile",
    ],
    [UserRole.L1]: [
      "/dashboard/l1",
      "/dashboard/l1/applications",
      "/dashboard/l1/applications/pending",
      "/dashboard/l1/applications/approved",
      "/dashboard/l1/applications/all",
      "/dashboard/l1/applications/rejected",
      "/dashboard/l1/notifications",
      "/dashboard/l1/profile",
    ],
    [UserRole.L2]: [
      "/dashboard/l2",
      "/dashboard/l2/applications",
      "/dashboard/l2/applications/pending",
      "/dashboard/l2/applications/approved",
      "/dashboard/l2/applications/all",
      "/dashboard/l2/applications/rejected",
      "/dashboard/l2/documents",
      "/dashboard/l2/notifications",
      "/dashboard/l2/profile",
    ],
    [UserRole.SCANNING]: [
      "/dashboard/scanning",
      "/dashboard/scanning/applications",
      "/dashboard/scanning/applications/pending",
      "/dashboard/scanning/applications/completed",
      "/dashboard/scanning/applications/all",
      "/dashboard/scanning/documents",
      "/dashboard/scanning/notifications",
      "/dashboard/scanning/profile",
    ],
    [UserRole.ADMIN]: [
      "/dashboard/admin",
      "/dashboard/admin/users",
      "/dashboard/admin/registrations",
      "/dashboard/admin/documents",
      "/dashboard/admin/notifications",
      "/dashboard/admin/profile",
    ],
    [UserRole.PAYROLL_MANAGER]: [
      "/dashboard/payroll-manager",
      "/dashboard/payroll-manager/attendance",
      "/dashboard/payroll-manager/notifications",
      "/dashboard/payroll-manager/profile",
    ],
    [UserRole.PAYROLL_EXECUTIVE]: [
      "/dashboard/payroll-executive",
      "/dashboard/payroll-executive/attendance",
      "/dashboard/payroll-executive/notifications",
      "/dashboard/payroll-executive/profile",
    ],
    [UserRole.SUPPORT]: [
      "/dashboard/support",
      "/dashboard/support/registrations",
      "/dashboard/support/registrations/",
      "/dashboard/support/documents",
      "/dashboard/support/notifications",
      "/dashboard/support/profile",
    ],
  };

  const roleAllowed = allowedPaths[role];
  if (!roleAllowed) return false;

  return roleAllowed.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function isEmployeeRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/status") ||
    pathname.startsWith("/application") ||
    pathname === "/apply" ||
    pathname === "/login"
  );
}

export function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    "/",
    "/about",
    "/services",
    "/careers",
    "/contact",
    "/privacy",
    "/terms",
    "/verify",
  ];
  if (publicPaths.includes(pathname)) return true;
  if (pathname.startsWith("/verify/")) return true;
  return false;
}

export function isStaffAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/staff/login") ||
    pathname.startsWith("/staff/forgot-password") ||
    pathname.startsWith("/staff/reset-password")
  );
}

export function isApiAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/api/auth");
}
