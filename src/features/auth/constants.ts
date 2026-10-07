import { UserRole } from "@/types/enums";

export const STAFF_ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.SUBMITTER, label: "Registration Submitter" },
  { value: UserRole.L1, label: "L1 Approver" },
  { value: UserRole.L2, label: "L2 Approver" },
  { value: UserRole.SCANNING, label: "Scanning" },
  { value: UserRole.SUPPORT, label: "Support" },
  { value: UserRole.PAYROLL_MANAGER, label: "Payroll Manager" },
  { value: UserRole.PAYROLL_EXECUTIVE, label: "Payroll Executive" },
] as const;

export const STAFF_ROLE_LABELS: Record<string, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.SUBMITTER]: "Registration Submitter",
  [UserRole.L1]: "L1 Approver",
  [UserRole.L2]: "L2 Approver",
  [UserRole.SCANNING]: "Scanning",
  [UserRole.SUPPORT]: "Support",
  [UserRole.PAYROLL_MANAGER]: "Payroll Manager",
  [UserRole.PAYROLL_EXECUTIVE]: "Payroll Executive",
};
