import { requireStaffAuth } from "@/lib/auth/guards";
import { StaffRole, UserRole } from "@/types/enums";
import { prisma } from "@/lib/db/prisma";
import { ProfilePageView } from "@/features/auth/components/ProfilePageView";

export const metadata = { title: "Profile | Payroll Manager" };

export default async function PayrollManagerProfilePage() {
  const { user } = await requireStaffAuth(UserRole.PAYROLL_MANAGER);
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      role: true,
      department: true,
      phone: true,
      lastLoginAt: true,
    },
  });

  if (!dbUser) return <p>User not found.</p>;

  return (
    <ProfilePageView
      backHref="/dashboard/payroll-manager"
      name={dbUser.name}
      email={dbUser.email}
      role={dbUser.role as StaffRole}
      department={dbUser.department}
      phone={dbUser.phone}
      lastLoginAt={dbUser.lastLoginAt}
    />
  );
}
