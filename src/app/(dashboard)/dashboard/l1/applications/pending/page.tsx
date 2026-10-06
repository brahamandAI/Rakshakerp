import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getL1PendingApplications } from "@/lib/services/l1.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "Pending Applications | L1" };

export default async function L1PendingApplicationsPage() {
  await requireStaffAuth(UserRole.L1);
  const applications = await getL1PendingApplications();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            Pending Applications
          </h2>
          <p className="text-[#64748B]">
            Applications awaiting L1 review and approval.
          </p>
        </div>
        <DownloadExcelButton scope="l1" />
      </div>
      <ApplicationTable
        applications={applications}
        emptyMessage="No applications pending L1 review."
        exportScope="l1"
      />
    </div>
  );
}
