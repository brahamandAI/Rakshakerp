import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getL2AllApprovedRegistrations } from "@/lib/services/l2.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "All Registrations | L2" };

export default async function L2AllRegistrationsPage() {
  await requireStaffAuth(UserRole.L2);
  const applications = await getL2AllApprovedRegistrations();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            All Registrations
          </h2>
          <p className="text-[#64748B]">
            Completely approved registrations after L2 approval.
          </p>
        </div>
        <DownloadExcelButton scope="l2" />
      </div>
      <ApplicationTable
        applications={applications}
        showEmployeeId
        viewPathPrefix="/dashboard/l2/applications"
        emptyMessage="No fully approved registrations yet."
        exportScope="l2"
      />
    </div>
  );
}
