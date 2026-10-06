"use server";

import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole, EmployeeStatus } from "@/types/enums";
import { prisma } from "@/lib/db/prisma";
import {
  createEmployeeSession,
  setEmployeeSessionCookie,
  clearEmployeeSessionCookie,
} from "@/lib/auth/employee-session";
import { redirect } from "next/navigation";

const EDITABLE = [
  EmployeeStatus.DRAFT,
  EmployeeStatus.SUBMITTED,
  EmployeeStatus.L1_REVIEW,
  EmployeeStatus.L1_RETURNED,
  EmployeeStatus.L2_RETURNED,
];

export async function startNewRegistrationAction(): Promise<void> {
  await requireStaffAuth(UserRole.SUBMITTER);
  await clearEmployeeSessionCookie();
  redirect("/dashboard/submitter?new=1");
}

export async function openSubmitterRegistrationAction(
  employeeId: string
): Promise<{ success: true; redirectTo: string } | { success: false; error: string }> {
  const { user } = await requireStaffAuth(UserRole.SUBMITTER);

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      submittedBy: user.id,
    },
  });

  if (!employee) {
    return { success: false, error: "Registration not found" };
  }

  if (!EDITABLE.includes(employee.status as EmployeeStatus)) {
    return {
      success: false,
      error: "This registration is locked and cannot be edited",
    };
  }

  const token = await createEmployeeSession({
    employeeId: employee.id,
    applicationRef: employee.applicationRef,
    email: employee.email,
  });
  await setEmployeeSessionCookie(token);
  return { success: true, redirectTo: "/dashboard/submitter?continue=1" };
}
