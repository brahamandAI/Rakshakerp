import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { listDepartments, listDesignations } from "@/lib/services/admin.service";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { DesignationsManager } from "@/features/admin/components/DesignationsManager";

export const metadata = { title: "Designations | Admin" };

export default async function AdminDesignationsPage() {
  await requireStaffAuth(UserRole.ADMIN);
  const [raw, departments] = await Promise.all([
    listDesignations(),
    listDepartments(),
  ]);

  const designations = raw.map((d) => ({
    _id: String(d._id),
    name: d.name,
    code: d.code,
    departmentId:
      d.departmentId &&
      typeof d.departmentId === "object" &&
      d.departmentId !== null &&
      "_id" in d.departmentId
        ? {
            _id: String(d.departmentId._id),
            name: String(d.departmentId.name),
          }
        : typeof d.departmentId === "string"
          ? d.departmentId
          : undefined,
    level: d.level ?? undefined,
    isActive: d.isActive,
  }));

  const deptOptions = departments.map((d) => ({
    _id: String(d._id),
    name: d.name,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Designations"
        description="Manage job designations linked to departments."
      />
      <DesignationsManager designations={designations} departments={deptOptions} />
    </div>
  );
}
