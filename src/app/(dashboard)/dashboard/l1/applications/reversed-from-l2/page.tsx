import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getL1ReversedFromL2Applications } from "@/lib/services/l1.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUi";

export const metadata = { title: "Reversed from L2 | L1" };

/** Reversals arrive from L2 at any time, so never serve a cached list. */
export const dynamic = "force-dynamic";

export default async function L1ReversedFromL2Page() {
  await requireStaffAuth(UserRole.L1);
  const applications = await getL1ReversedFromL2Applications();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Reversed from L2"
        description="Applications the L2 approver sent back for re-review. Correct the flagged details, then approve again to forward them to L2."
      />
      <ApplicationTable
        applications={applications}
        emptyMessage="No applications reversed from L2"
        emptyDescription="Applications sent back by the L2 approver will appear here with their reverse note."
        showL2ReverseNote
        exportScope="l1"
      />
    </div>
  );
}
