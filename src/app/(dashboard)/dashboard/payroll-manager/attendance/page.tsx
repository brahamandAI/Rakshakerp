import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { AttendanceRecordsTable } from "@/features/attendance/components/AttendanceRecordsTable";
import {
  listAssignedExecutives,
  listAttendance,
} from "@/lib/services/attendance.service";

export const metadata = { title: "Attendance | Payroll Manager" };
export const dynamic = "force-dynamic";

export default async function PayrollManagerAttendancePage() {
  const { user } = await requireStaffAuth(UserRole.PAYROLL_MANAGER);
  const [records, executives] = await Promise.all([
    listAttendance(user),
    listAssignedExecutives(user.id),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Attendance"
        description="Open, download, or forward files that were submitted to you."
      />
      <AttendanceRecordsTable
        records={records}
        viewer="manager"
        detailBase="/dashboard/payroll-manager/attendance"
        executives={executives}
      />
    </div>
  );
}
