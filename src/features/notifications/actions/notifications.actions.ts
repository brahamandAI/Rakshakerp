"use server";

import { revalidatePath } from "next/cache";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getEmployeeSession } from "@/lib/auth/employee-session";
import { ROLE_DASHBOARD_PATH, StaffRole, UserRole } from "@/types/enums";
import {
  markStaffNotificationRead,
  markAllStaffNotificationsRead,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notification.service";
import { STAFF_NOTIFICATIONS_PATH, EMPLOYEE_NOTIFICATIONS_PATH } from "@/features/notifications/constants";

function revalidateStaffNotifications(role: StaffRole) {
  const notificationsPath = STAFF_NOTIFICATIONS_PATH[role];
  if (notificationsPath) revalidatePath(notificationsPath);
  revalidatePath(ROLE_DASHBOARD_PATH[role]);
}

export async function markStaffNotificationReadAction(notificationId: string) {
  const { user } = await requireStaffAuth();
  await markStaffNotificationRead(notificationId, user.id);
  revalidateStaffNotifications(user.role);
}

export async function markAllStaffNotificationsReadAction() {
  const { user } = await requireStaffAuth();
  await markAllStaffNotificationsRead(user.id);
  revalidateStaffNotifications(user.role);
}

export async function markEmployeeNotificationReadAction(notificationId: string) {
  const session = await getEmployeeSession();
  if (!session) throw new Error("Unauthorized");
  await markNotificationRead(notificationId, "EMPLOYEE", session.employeeId);
  revalidatePath(EMPLOYEE_NOTIFICATIONS_PATH);
  revalidatePath("/application");
  revalidatePath("/apply");
}

export async function markAllEmployeeNotificationsReadAction() {
  const session = await getEmployeeSession();
  if (!session) throw new Error("Unauthorized");
  await markAllNotificationsRead("EMPLOYEE", session.employeeId);
  revalidatePath(EMPLOYEE_NOTIFICATIONS_PATH);
  revalidatePath("/application");
  revalidatePath("/apply");
}

/** Role-specific wrappers for backward compatibility */
export async function markNotificationReadAction(notificationId: string) {
  return markStaffNotificationReadAction(notificationId);
}

export async function markAllNotificationsReadAction() {
  return markAllStaffNotificationsReadAction();
}

export async function markL2NotificationReadAction(notificationId: string) {
  await requireStaffAuth(UserRole.L2);
  return markStaffNotificationReadAction(notificationId);
}

export async function markAllL2NotificationsReadAction() {
  await requireStaffAuth(UserRole.L2);
  return markAllStaffNotificationsReadAction();
}

export async function markSupportNotificationReadAction(notificationId: string) {
  await requireStaffAuth(UserRole.SUPPORT);
  return markStaffNotificationReadAction(notificationId);
}

export async function markAllSupportNotificationsReadAction() {
  await requireStaffAuth(UserRole.SUPPORT);
  return markAllStaffNotificationsReadAction();
}
