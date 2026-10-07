import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { listStaffUsers } from "@/lib/services/admin.service";
import { listActivePayrollManagers } from "@/lib/services/attendance.service";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { UsersManager } from "@/features/admin/components/UsersManager";

export const metadata = { title: "User Management | Admin" };

const MANAGEABLE = new Set([
  UserRole.SUBMITTER,
  UserRole.L1,
  UserRole.L2,
  UserRole.SCANNING,
  UserRole.ADMIN,
  UserRole.PAYROLL_MANAGER,
  UserRole.PAYROLL_EXECUTIVE,
]);

export default async function AdminUsersPage() {
  const { user } = await requireStaffAuth(UserRole.ADMIN);
  const [raw, payrollManagers] = await Promise.all([
    listStaffUsers(),
    listActivePayrollManagers(),
  ]);

  const users = raw
    .filter((u) => MANAGEABLE.has(u.role as UserRole))
    .map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role as
        | UserRole.SUBMITTER
        | UserRole.L1
        | UserRole.L2
        | UserRole.SCANNING
        | UserRole.ADMIN
        | UserRole.PAYROLL_MANAGER
        | UserRole.PAYROLL_EXECUTIVE,
      department: u.department ?? undefined,
      phone: u.phone ?? undefined,
      assignedPayrollManagerId: u.assignedPayrollManagerId ?? undefined,
      assignedPayrollManagerName: u.assignedPayrollManager?.name,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt?.toISOString(),
      createdAt: u.createdAt.toISOString(),
    }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Create and manage Submitter, L1, L2, Scanning, Payroll, and Super Admin accounts."
      />
      <UsersManager
        users={users}
        currentUserId={user.id}
        payrollManagers={payrollManagers}
      />
    </div>
  );
}
