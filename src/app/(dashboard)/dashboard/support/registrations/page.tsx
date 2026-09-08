import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getAdminCompletedRegistrations } from "@/lib/services/submitter.service";
import { RegistrationsTable } from "@/features/submitter/components/RegistrationsTable";

export const metadata = { title: "L2 Approved Registrations | Support" };

export default async function SupportRegistrationsPage() {
  await requireStaffAuth(UserRole.SUPPORT);
  const registrations = await getAdminCompletedRegistrations();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-primary">
          L2 Approved Registrations
        </h2>
        <p className="text-[#64748B]">
          Read-only list of registrations approved by L2 with Temporary Employee IDs.
        </p>
      </div>
      <RegistrationsTable
        registrations={registrations}
        showViewLink
        showSubmitter
        viewPathPrefix="/dashboard/support/registrations"
        emptyMessage="No L2-approved registrations are available."
      />
    </div>
  );
}
