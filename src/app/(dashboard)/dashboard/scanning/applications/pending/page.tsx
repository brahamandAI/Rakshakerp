import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getScanningPendingApplications } from "@/lib/services/scanning.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "Pending | Scanning" };

export default async function ScanningPendingPage() {
  await requireStaffAuth(UserRole.SCANNING);
  const applications = await getScanningPendingApplications();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            Pending
          </h2>
          <p className="text-[#64748B]">
            L2-approved registrations waiting for scanning completion.
          </p>
        </div>
        <DownloadExcelButton scope="scanning" />
      </div>
      <ApplicationTable
        applications={applications}
        viewPathPrefix="/dashboard/scanning/applications"
        showEmployeeId
        emptyMessage="No registrations pending scanning."
        exportScope="scanning"
      />
    </div>
  );
}
