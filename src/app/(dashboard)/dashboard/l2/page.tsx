import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Send,
  XCircle,
} from "lucide-react";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getL2Stats, getL2RecentPending } from "@/lib/services/l2.service";
import { L2ApplicationTable } from "@/features/l2/components/L2ApplicationTable";
import {
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard/DashboardUi";

export const metadata = { title: "L2 Dashboard" };

export default async function L2DashboardPage() {
  const { user } = await requireStaffAuth(UserRole.L2);

  const [stats, recent] = await Promise.all([
    getL2Stats(user.id),
    getL2RecentPending(5),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="L2 Approval"
        description="Final review, temporary ID generation, and document folders."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Awaiting approval"
          value={stats.pending}
          description="Ready for L2 review"
          href="/dashboard/l2/applications/pending"
          linkLabel="Open queue"
          tone="blue"
          icon={Clock3}
        />
        <DashboardStatCard
          title="Approved"
          value={stats.approved}
          description="Approved by L2"
          href="/dashboard/l2/applications/approved"
          linkLabel="History"
          tone="green"
          icon={CheckCircle2}
        />
        <DashboardStatCard
          title="Reversed"
          value={stats.rejected}
          description="Sent back for correction"
          href="/dashboard/l2/applications/rejected"
          linkLabel="View"
          tone="red"
          icon={XCircle}
        />
        <DashboardStatCard
          title="Sent to Admin"
          value={stats.forwarded}
          description={`${stats.approvedThisMonth} this month`}
          href="/dashboard/l2/applications/approved"
          linkLabel="View approved"
          tone="slate"
          icon={Send}
        />
      </div>

      <DashboardSection
        title="Recent pending"
        icon={Clock3}
        action={
          <Link
            href="/dashboard/l2/applications/pending"
            className="text-sm font-medium text-[#1D4ED8] transition hover:underline"
          >
            View all
          </Link>
        }
      >
        <L2ApplicationTable
          applications={recent}
          viewPathPrefix="/dashboard/l2/applications"
          emptyMessage="No applications awaiting L2 approval"
        />
      </DashboardSection>
    </div>
  );
}
