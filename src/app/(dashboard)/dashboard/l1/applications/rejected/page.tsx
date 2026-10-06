import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getL1RejectedApplications } from "@/lib/services/l1.service";
import { ApplicationTable } from "@/features/l1/components/ApplicationTable";

export const metadata = { title: "Reversed Applications | L1" };

export default async function L1RejectedApplicationsPage() {
  const { user } = await requireStaffAuth(UserRole.L1);
  const applications = await getL1RejectedApplications(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-primary">
          Reversed Applications
        </h2>
        <p className="text-[#64748B]">
          Applications sent back for correction with reverse notes.
        </p>
      </div>
      <ApplicationTable
        applications={applications}
        emptyMessage="No reversed applications."
        exportScope="l1"
      />
    </div>
  );
}
