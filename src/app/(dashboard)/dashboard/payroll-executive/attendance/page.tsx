import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { AttendanceRecordsTable } from "@/features/attendance/components/AttendanceRecordsTable";
import { listAttendance } from "@/lib/services/attendance.service";

export const metadata = { title: "Attendance | Payroll Executive" };
export const dynamic = "force-dynamic";

export default async function PayrollExecutiveAttendancePage() {
  const { user } = await requireStaffAuth(UserRole.PAYROLL_EXECUTIVE);
  const records = await listAttendance(user);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Attendance"
        description="Files forwarded to you by your Payroll Manager."
      />
      <AttendanceRecordsTable
        records={records}
        viewer="executive"
        detailBase="/dashboard/payroll-executive/attendance"
      />
    </div>
  );
}
