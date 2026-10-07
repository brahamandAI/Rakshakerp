import Link from "next/link";
import { ClipboardCheck, Inbox } from "lucide-react";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import {
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard/DashboardUi";
import { AttendanceRecordsTable } from "@/features/attendance/components/AttendanceRecordsTable";
import {
  getAttendanceStats,
  listAttendance,
} from "@/lib/services/attendance.service";

export const metadata = { title: "Payroll Executive" };
export const dynamic = "force-dynamic";

export default async function PayrollExecutiveDashboardPage() {
  const { user } = await requireStaffAuth(UserRole.PAYROLL_EXECUTIVE);
  const [stats, records] = await Promise.all([
    getAttendanceStats(user),
    listAttendance(user),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Payroll Executive"
        description="You only see attendance that your Payroll Manager forwarded to you."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <DashboardStatCard
          title="Received"
          value={stats.total}
          description="Files forwarded to you"
          href="/dashboard/payroll-executive/attendance"
          linkLabel="Open attendance"
          tone="blue"
          icon={Inbox}
        />
        <DashboardStatCard
          title="Attendance"
          value={stats.total}
          description="Open or download the original file"
          href="/dashboard/payroll-executive/attendance"
          linkLabel="View files"
          tone="default"
          icon={ClipboardCheck}
        />
      </div>
      <DashboardSection
        title="Recent attendance"
        icon={ClipboardCheck}
        action={
          <Link href="/dashboard/payroll-executive/attendance" className="text-sm font-semibold text-[#0284C7]">
            View all
          </Link>
        }
      >
        <AttendanceRecordsTable
          records={records.slice(0, 5)}
          viewer="executive"
          detailBase="/dashboard/payroll-executive/attendance"
        />
      </DashboardSection>
    </div>
  );
}
