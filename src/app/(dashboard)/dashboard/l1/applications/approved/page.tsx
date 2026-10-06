import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getL1ApprovedApplications } from "@/lib/services/l1.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "Approved Applications | L1" };

export default async function L1ApprovedApplicationsPage() {
  const { user } = await requireStaffAuth(UserRole.L1);
  const applications = await getL1ApprovedApplications(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            Approved Applications
          </h2>
          <p className="text-[#64748B]">
            Applications you have approved and forwarded for L2 review.
          </p>
        </div>
        <DownloadExcelButton scope="l1" />
      </div>
      <ApplicationTable
        applications={applications}
        showEmployeeId
        emptyMessage="No approved applications yet."
        exportScope="l1"
      />
    </div>
  );
}
