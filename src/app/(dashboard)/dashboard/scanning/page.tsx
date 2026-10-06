import Link from "next/link";
import { CheckCircle2, Clock3, Files } from "lucide-react";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import {
  getScanningRecentPending,
  getScanningStats,
} from "@/lib/services/scanning.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import {
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard/DashboardUi";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "Scanning Dashboard" };

export default async function ScanningDashboardPage() {
  await requireStaffAuth(UserRole.SCANNING);

  const [stats, recent] = await Promise.all([
    getScanningStats(),
    getScanningRecentPending(5),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Scanning"
        description="Review L2-approved registrations and mark scanning completed."
        actions={<DownloadExcelButton scope="scanning" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="Pending"
          value={stats.pending}
          description="Awaiting scanning"
          href="/dashboard/scanning/applications/pending"
          linkLabel="Open queue"
          tone="blue"
          icon={Clock3}
        />
        <DashboardStatCard
          title="Approved / Scanning Completed"
          value={stats.completed}
          description="Scanning finished"
          href="/dashboard/scanning/applications/completed"
          linkLabel="View"
          tone="green"
          icon={CheckCircle2}
        />
        <DashboardStatCard
          title="All"
          value={stats.all}
          description="Pending and completed"
          href="/dashboard/scanning/applications/all"
          linkLabel="Browse"
          tone="slate"
          icon={Files}
        />
      </div>

      <DashboardSection
        title="Recent pending"
        icon={Clock3}
        action={
          <Link
            href="/dashboard/scanning/applications/pending"
            className="text-sm font-medium text-[#1D4ED8] transition hover:underline"
          >
            View all
          </Link>
        }
      >
        <ApplicationTable
          applications={recent}
          viewPathPrefix="/dashboard/scanning/applications"
          showEmployeeId
          emptyMessage="No registrations awaiting scanning"
          exportScope="scanning"
        />
      </DashboardSection>
    </div>
  );
}
