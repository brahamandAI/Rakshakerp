import { requireStaffAuth } from "@/lib/auth/guards";
import { DashboardFrame } from "@/components/layout/dashboard/DashboardFrame";
import { getStaffUnreadCount } from "@/lib/services/notification.service";
import { STAFF_NOTIFICATIONS_PATH } from "@/features/notifications/constants";
import { UserRole } from "@/types/enums";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireStaffAuth();
  const unreadCountPromise = getStaffUnreadCount(user.id);
  const notificationsHref =
    STAFF_NOTIFICATIONS_PATH[user.role] ?? "/dashboard/admin/notifications";

  const homeHref =
    user.role === UserRole.SUBMITTER
      ? "/dashboard/submitter"
      : user.role === UserRole.L1
        ? "/dashboard/l1"
        : user.role === UserRole.L2
          ? "/dashboard/l2"
          : user.role === UserRole.SCANNING
            ? "/dashboard/scanning"
            : user.role === UserRole.ADMIN
              ? "/dashboard/admin"
              : "/dashboard/support";

  return (
    <DashboardFrame
      user={{ name: user.name, email: user.email, role: user.role }}
      unreadCountPromise={unreadCountPromise}
      notificationsHref={notificationsHref}
      homeHref={homeHref}
      profileHref={`${homeHref}/profile`}
    >
      {children}
    </DashboardFrame>
  );
}
