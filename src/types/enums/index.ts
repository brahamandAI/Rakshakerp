export enum UserRole {
  EMPLOYEE = "EMPLOYEE",
  SUBMITTER = "SUBMITTER",
  L1 = "L1",
  L2 = "L2",
  SCANNING = "SCANNING",
  SUPPORT = "SUPPORT",
  ADMIN = "ADMIN",
}

export enum EmployeeStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  L1_REVIEW = "L1_REVIEW",
  L1_RETURNED = "L1_RETURNED",
  L2_REVIEW = "L2_REVIEW",
  L2_RETURNED = "L2_RETURNED",
  APPROVED = "APPROVED",
  ID_GENERATED = "ID_GENERATED",
  SCANNING_COMPLETED = "SCANNING_COMPLETED",
  ID_CARD_ISSUED = "ID_CARD_ISSUED",
  REJECTED = "REJECTED",
}

/** Internal staff roles that use NextAuth */
export const STAFF_ROLES = [
  UserRole.SUBMITTER,
  UserRole.L1,
  UserRole.L2,
  UserRole.SCANNING,
  UserRole.SUPPORT,
  UserRole.ADMIN,
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_DASHBOARD_PATH: Record<StaffRole, string> = {
  [UserRole.SUBMITTER]: "/dashboard/submitter",
  [UserRole.L1]: "/dashboard/l1",
  [UserRole.L2]: "/dashboard/l2",
  [UserRole.SCANNING]: "/dashboard/scanning",
  [UserRole.SUPPORT]: "/dashboard/support",
  [UserRole.ADMIN]: "/dashboard/admin",
};

export const ROLE_ROUTE_PREFIX: Record<StaffRole, string> = {
  [UserRole.SUBMITTER]: "/dashboard/submitter",
  [UserRole.L1]: "/dashboard/l1",
  [UserRole.L2]: "/dashboard/l2",
  [UserRole.SCANNING]: "/dashboard/scanning",
  [UserRole.SUPPORT]: "/dashboard/support",
  [UserRole.ADMIN]: "/dashboard/admin",
};

/** Routes accessible without authentication */
export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/careers",
  "/contact",
  "/privacy",
  "/terms",
  "/verify",
] as const;

/** Employee portal routes (legacy registration tracking) */
export const EMPLOYEE_ROUTES = [
  "/login",
  "/apply",
  "/onboarding",
  "/status",
  "/application",
] as const;

/** Staff auth routes */
export const STAFF_AUTH_ROUTES = [
  "/staff/login",
  "/staff/forgot-password",
  "/staff/reset-password",
] as const;

export const EMPLOYEE_SESSION_COOKIE = "employee_session";
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;
export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCK_MINUTES = 30;
