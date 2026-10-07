import { requireStaffAuth } from "@/lib/auth/guards";
import { DashboardFrame } from "@/components/layout/dashboard/DashboardFrame";
import { getStaffUnreadCount } from "@/lib/services/notification.service";
import { STAFF_NOTIFICATIONS_PATH } from "@/features/notifications/constants";
import { ROLE_DASHBOARD_PATH } from "@/types/enums";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireStaffAuth();
  const unreadCountPromise = getStaffUnreadCount(user.id);
  const notificationsHref =
    STAFF_NOTIFICATIONS_PATH[user.role] ?? "/dashboard/admin/notifications";

  const homeHref = ROLE_DASHBOARD_PATH[user.role];

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
