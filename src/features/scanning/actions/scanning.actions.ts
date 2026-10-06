"use server";

import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import {
  performScanningComplete,
  ScanningError,
} from "@/lib/services/scanning.service";
import { revalidatePath } from "next/cache";
import {
  revalidateAdminDashboard,
  revalidateL1Dashboard,
  revalidateL2Dashboard,
  revalidateScanningDashboard,
  revalidateSubmitterDashboard,
} from "@/lib/revalidate/staff-dashboard";

export type ScanningActionResult =
  | { success: true }
  | { success: false; error: string };

export async function scanningCompleteAction(
  formData: FormData
): Promise<ScanningActionResult> {
  try {
    const { user } = await requireStaffAuth(UserRole.SCANNING);
    const employeeId = String(formData.get("employeeId") ?? "");
    const scanningCompleted = formData.get("scanningCompleted") === "true";
    const comment = String(formData.get("comment") ?? "").trim() || undefined;

    await performScanningComplete(
      employeeId,
      user.id,
      scanningCompleted,
      comment
    );

    revalidateScanningDashboard();
    revalidatePath(`/dashboard/scanning/applications/${employeeId}`);
    revalidateL1Dashboard();
    revalidateL2Dashboard();
    revalidateAdminDashboard();
    revalidateSubmitterDashboard();

    return { success: true };
  } catch (error) {
    if (error instanceof ScanningError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to complete scanning" };
  }
}
