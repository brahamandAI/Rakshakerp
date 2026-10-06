import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { listSiteLocations } from "@/lib/services/admin.service";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { SiteLocationsManager } from "@/features/admin/components/SiteLocationsManager";

export const metadata = { title: "Site Locations | Admin" };

export default async function AdminSitesPage() {
  await requireStaffAuth(UserRole.ADMIN);
  const raw = await listSiteLocations();

  const sites = raw.map((s) => ({
    _id: String(s._id),
    name: s.name,
    code: s.code,
    address: s.address ?? undefined,
    city: s.city,
    state: s.state,
    pincode: s.pincode ?? undefined,
    contactPerson: s.contactPerson ?? undefined,
    contactPhone: s.contactPhone ?? undefined,
    isActive: s.isActive,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site Locations"
        description="Manage deployment sites and branch locations."
      />
      <SiteLocationsManager sites={sites} />
    </div>
  );
}
