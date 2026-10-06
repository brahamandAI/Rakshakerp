import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { listDepartments } from "@/lib/services/admin.service";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { DepartmentsManager } from "@/features/admin/components/DepartmentsManager";

export const metadata = { title: "Departments | Admin" };

export default async function AdminDepartmentsPage() {
  await requireStaffAuth(UserRole.ADMIN);
  const raw = await listDepartments();

  const departments = raw.map((d) => ({
    _id: String(d._id),
    name: d.name,
    code: d.code,
    description: d.description ?? undefined,
    isActive: d.isActive,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Departments"
        description="Manage organizational departments for staff and employee assignments."
      />
      <DepartmentsManager departments={departments} />
    </div>
  );
}
