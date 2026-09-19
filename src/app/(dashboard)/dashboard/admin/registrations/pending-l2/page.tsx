import { requireStaffAuth } from "@/lib/auth/guards";
import { EmployeeStatus, UserRole } from "@/types/enums";
import { getAdminQueueRegistrations } from "@/lib/services/submitter.service";
import { RegistrationsTable } from "@/features/submitter/components/RegistrationsTable";

export const metadata = { title: "Pending L2 | Admin" };

export default async function AdminPendingL2Page() {
  await requireStaffAuth(UserRole.ADMIN);
  const registrations = await getAdminQueueRegistrations([
    EmployeeStatus.L2_REVIEW,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-primary">Pending L2</h2>
        <p className="text-[#64748B]">
          Registrations waiting for final L2 approval.
        </p>
      </div>
      <RegistrationsTable
        registrations={registrations}
        showViewLink
        showSubmitter
        viewPathPrefix="/dashboard/admin/registrations"
        emptyMessage="No registrations are waiting for L2 approval."
      />
    </div>
  );
}
