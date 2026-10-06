import { revalidatePath } from "next/cache";

export function revalidateL1Dashboard() {
  revalidatePath("/dashboard/l1");
  revalidatePath("/dashboard/l1/applications");
  revalidatePath("/dashboard/l1/applications/pending");
  revalidatePath("/dashboard/l1/applications/approved");
  revalidatePath("/dashboard/l1/applications/all");
  revalidatePath("/dashboard/l1/applications/rejected");
}

export function revalidateL2Dashboard() {
  revalidatePath("/dashboard/l2");
  revalidatePath("/dashboard/l2/applications");
  revalidatePath("/dashboard/l2/applications/pending");
  revalidatePath("/dashboard/l2/applications/approved");
  revalidatePath("/dashboard/l2/applications/all");
  revalidatePath("/dashboard/l2/applications/rejected");
}

export function revalidateScanningDashboard() {
  revalidatePath("/dashboard/scanning");
  revalidatePath("/dashboard/scanning/applications/pending");
  revalidatePath("/dashboard/scanning/applications/completed");
  revalidatePath("/dashboard/scanning/applications/all");
  revalidatePath("/dashboard/scanning/documents");
  revalidatePath("/dashboard/scanning/notifications");
}

export function revalidateSupportDashboard() {
  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard/support/registrations");
  revalidatePath("/dashboard/support/id-cards");
  revalidatePath("/dashboard/support/id-cards/pending");
  revalidatePath("/dashboard/support/id-cards/generate");
  revalidatePath("/dashboard/support/id-cards/completed");
}

export function revalidateSubmitterDashboard() {
  revalidatePath("/dashboard/submitter");
  revalidatePath("/dashboard/submitter/registrations");
  revalidatePath("/dashboard/submitter/registrations/reversed");
  revalidatePath("/dashboard/submitter/notifications");
  revalidatePath("/dashboard/submitter/profile");
}

export function revalidateAdminDashboard() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/registrations");
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/dashboard/admin/company");
  revalidatePath("/dashboard/admin/departments");
  revalidatePath("/dashboard/admin/designations");
  revalidatePath("/dashboard/admin/sites");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/audit-logs");
  revalidatePath("/dashboard/admin/profile");
}

export function revalidateEmployeePortal() {
  revalidatePath("/application");
  revalidatePath("/apply");
}

export function revalidateAllStaffDashboards() {
  revalidateL1Dashboard();
  revalidateL2Dashboard();
  revalidateScanningDashboard();
  revalidateSupportDashboard();
  revalidateSubmitterDashboard();
  revalidateAdminDashboard();
  revalidateEmployeePortal();
}
