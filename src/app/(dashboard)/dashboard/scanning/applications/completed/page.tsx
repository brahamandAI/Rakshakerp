import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getScanningCompletedApplications } from "@/lib/services/scanning.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "Approved / Scanning Completed | Scanning" };

export default async function ScanningCompletedPage() {
  await requireStaffAuth(UserRole.SCANNING);
  const applications = await getScanningCompletedApplications();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            Approved / Scanning Completed
          </h2>
          <p className="text-[#64748B]">
            Registrations marked as scanning completed.
          </p>
        </div>
        <DownloadExcelButton scope="scanning" />
      </div>
      <ApplicationTable
        applications={applications}
        viewPathPrefix="/dashboard/scanning/applications"
        showEmployeeId
        emptyMessage="No scanning-completed registrations yet."
        exportScope="scanning"
      />
    </div>
  );
}
