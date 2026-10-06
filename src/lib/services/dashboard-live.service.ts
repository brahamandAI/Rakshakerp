import { prisma } from "@/lib/db/prisma";
import { EmployeeStatus, StaffRole, UserRole } from "@/types/enums";
import { getStaffUnreadCount } from "@/lib/services/notification.service";

export interface DashboardLiveSnapshot {
  fingerprint: string;
  pendingCount: number;
  unreadCount: number;
  role: StaffRole;
}

/**
 * Cheap change detector for the dashboard poller.
 * Full queue stats are loaded by each page — this endpoint only needs a
 * watermark so router.refresh() can run when something actually changed.
 */
export async function getDashboardLiveSnapshot(
  role: StaffRole,
  userId: string
): Promise<DashboardLiveSnapshot> {
  const activityWhere =
    role === UserRole.SUBMITTER
      ? {
          submittedBy: userId,
          status: { not: EmployeeStatus.DRAFT },
        }
      : { status: { not: EmployeeStatus.DRAFT } };

  const [unreadCount, latest] = await Promise.all([
    getStaffUnreadCount(userId),
    prisma.employee.findFirst({
      where: activityWhere,
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const latestActivity = latest?.updatedAt
    ? new Date(latest.updatedAt).getTime()
    : 0;

  return {
    role,
    pendingCount: unreadCount,
    unreadCount,
    fingerprint: `${role}:${unreadCount}:${latestActivity}`,
  };
}
