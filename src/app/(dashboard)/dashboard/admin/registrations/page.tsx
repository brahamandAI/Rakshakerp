import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getAdminCompletedRegistrations } from "@/lib/services/submitter.service";
import { RegistrationsTable } from "@/features/submitter/components/RegistrationsTable";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";

export const metadata = { title: "Approved Registrations | Admin" };

export default async function AdminRegistrationsPage() {
  await requireStaffAuth(UserRole.ADMIN);
  const registrations = await getAdminCompletedRegistrations();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">
            Approved Registrations
          </h2>
          <p className="text-[#64748B]">
            Registrations that have completed L1 and L2 approval with a Temporary
            Employee ID.
          </p>
        </div>
        <DownloadExcelButton scope="admin" />
      </div>
      <RegistrationsTable
        registrations={registrations}
        showViewLink
        showSubmitter
        viewPathPrefix="/dashboard/admin/registrations"
        emptyMessage="No L2-approved registrations have been forwarded yet."
      />
    </div>
  );
}
