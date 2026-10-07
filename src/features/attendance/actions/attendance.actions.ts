"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import {
  AttendanceError,
  forwardAttendance,
} from "@/lib/services/attendance.service";

export type AttendanceActionResult =
  | { success: true }
  | { success: false; error: string };

async function clientIp(): Promise<string | undefined> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

function revalidateAttendance() {
  revalidatePath("/dashboard/submitter/attendance");
  revalidatePath("/dashboard/payroll-manager");
  revalidatePath("/dashboard/payroll-manager/attendance");
  revalidatePath("/dashboard/payroll-executive");
  revalidatePath("/dashboard/payroll-executive/attendance");
}

export async function forwardAttendanceAction(input: {
  attendanceId: string;
  payrollExecutiveId: string;
}): Promise<AttendanceActionResult> {
  const { user } = await requireStaffAuth(UserRole.PAYROLL_MANAGER);
  if (!input.attendanceId || !input.payrollExecutiveId) {
    return { success: false, error: "Select a Payroll Executive." };
  }

  try {
    await forwardAttendance({
      actor: user,
      attendanceId: input.attendanceId,
      payrollExecutiveId: input.payrollExecutiveId,
      ipAddress: await clientIp(),
    });
    revalidateAttendance();
    return { success: true };
  } catch (error) {
    if (error instanceof AttendanceError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to forward attendance." };
  }
}
