import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getScanningAllApplications } from "@/lib/services/scanning.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "All | Scanning" };

export default async function ScanningAllPage() {
  await requireStaffAuth(UserRole.SCANNING);
  const applications = await getScanningAllApplications();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">All</h2>
          <p className="text-[#64748B]">
            Pending and scanning-completed registrations in one list.
          </p>
        </div>
        <DownloadExcelButton scope="scanning" />
      </div>
      <ApplicationTable
        applications={applications}
        viewPathPrefix="/dashboard/scanning/applications"
        showEmployeeId
        emptyMessage="No scanning registrations yet."
        exportScope="scanning"
      />
    </div>
  );
}
