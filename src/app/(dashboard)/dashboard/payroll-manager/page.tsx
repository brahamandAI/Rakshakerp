import Link from "next/link";
import { ClipboardCheck, Forward, Inbox } from "lucide-react";
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
  listAssignedExecutives,
  listAttendance,
} from "@/lib/services/attendance.service";

export const metadata = { title: "Payroll Manager" };
export const dynamic = "force-dynamic";

export default async function PayrollManagerDashboardPage() {
  const { user } = await requireStaffAuth(UserRole.PAYROLL_MANAGER);
  const [stats, records, executives] = await Promise.all([
    getAttendanceStats(user),
    listAttendance(user),
    listAssignedExecutives(user.id),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Payroll Manager"
        description="Attendance files appear here only when a Registration Submitter selects you."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <DashboardStatCard
          title="Received"
          value={stats.received}
          description="Waiting to be forwarded"
          href="/dashboard/payroll-manager/attendance"
          linkLabel="Open attendance"
          tone="blue"
          icon={Inbox}
        />
        <DashboardStatCard
          title="Forwarded"
          value={stats.forwarded}
          description="Sent to a Payroll Executive"
          href="/dashboard/payroll-manager/attendance"
          linkLabel="View forwarded"
          tone="green"
          icon={Forward}
        />
        <DashboardStatCard
          title="Total"
          value={stats.total}
          description="Files submitted to you"
          href="/dashboard/payroll-manager/attendance"
          linkLabel="View all"
          tone="default"
          icon={ClipboardCheck}
        />
      </div>
      <DashboardSection
        title="Recent attendance"
        icon={ClipboardCheck}
        action={
          <Link href="/dashboard/payroll-manager/attendance" className="text-sm font-semibold text-[#0284C7]">
            View all
          </Link>
        }
      >
        <AttendanceRecordsTable
          records={records.slice(0, 5)}
          viewer="manager"
          detailBase="/dashboard/payroll-manager/attendance"
          executives={executives}
        />
      </DashboardSection>
    </div>
  );
}
