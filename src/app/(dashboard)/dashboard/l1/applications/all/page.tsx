import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getL1AllApprovedRegistrations } from "@/lib/services/l1.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "All Registrations | L1" };

export default async function L1AllRegistrationsPage() {
  await requireStaffAuth(UserRole.L1);
  const applications = await getL1AllApprovedRegistrations();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            All Registrations
          </h2>
          <p className="text-[#64748B]">
            Completely approved registrations with Temporary Employee ID.
          </p>
        </div>
        <DownloadExcelButton scope="l1" />
      </div>
      <ApplicationTable
        applications={applications}
        showEmployeeId
        emptyMessage="No fully approved registrations yet."
        exportScope="l1"
      />
    </div>
  );
}
