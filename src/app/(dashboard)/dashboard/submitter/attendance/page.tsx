import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { AttendanceUploadForm } from "@/features/attendance/components/AttendanceUploadForm";
import { AttendanceRecordsTable } from "@/features/attendance/components/AttendanceRecordsTable";
import {
  listActivePayrollManagers,
  listAttendance,
} from "@/lib/services/attendance.service";

export const metadata = { title: "Attendance Upload | Submitter" };
export const dynamic = "force-dynamic";

export default async function SubmitterAttendancePage() {
  const { user } = await requireStaffAuth(UserRole.SUBMITTER);
  const [managers, records] = await Promise.all([
    listActivePayrollManagers(),
    listAttendance(user),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Attendance Upload"
        description="Send an attendance file to a Payroll Manager. Only that manager can see it."
      />
      <AttendanceUploadForm managers={managers} />
      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-primary">Your uploads</h3>
        <AttendanceRecordsTable
          records={records}
          viewer="submitter"
          detailBase="/dashboard/submitter/attendance"
        />
      </div>
    </div>
  );
}
