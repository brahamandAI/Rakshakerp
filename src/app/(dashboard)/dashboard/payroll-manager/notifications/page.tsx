import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getStaffNotificationHistory } from "@/lib/services/notification.service";
import { StaffNotificationsPanel } from "@/features/notifications/components/StaffNotificationsPanel";

export const metadata = { title: "Notifications | Payroll Manager" };

export default async function PayrollManagerNotificationsPage() {
  const { user } = await requireStaffAuth(UserRole.PAYROLL_MANAGER);
  const notifications = await getStaffNotificationHistory(user.id, 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-primary">Notifications</h2>
        <p className="text-[#64748B]">Updates for your payroll account.</p>
      </div>
      <StaffNotificationsPanel notifications={notifications} />
    </div>
  );
}
