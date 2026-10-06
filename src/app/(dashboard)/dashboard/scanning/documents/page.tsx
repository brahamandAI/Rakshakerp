import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { EmployeeDocumentsBrowser } from "@/features/documents/components/EmployeeDocumentsBrowser";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";

export const metadata = { title: "Employee Documents | Scanning" };

export default async function ScanningEmployeeDocumentsPage() {
  await requireStaffAuth(UserRole.SCANNING);

  return (
    <div className="space-y-6">
      <DashboardBackLink href="/dashboard/scanning" />
      <DashboardPageHeader
        title="Employee Documents"
        description="Employee folders created after L2 approval — available for scanning review and download."
      />
      <EmployeeDocumentsBrowser />
    </div>
  );
}
