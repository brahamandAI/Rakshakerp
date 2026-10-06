import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole, StaffRole } from "@/types/enums";
import { prisma } from "@/lib/db/prisma";
import { ProfilePageView } from "@/features/auth/components/ProfilePageView";

export const metadata = { title: "Profile | Support" };

export default async function SupportProfilePage() {
  const { user } = await requireStaffAuth(UserRole.SUPPORT);

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

  if (!dbUser) {
    return <p>User not found.</p>;
  }

  return (
    <ProfilePageView
      backHref="/dashboard/support"
      name={dbUser.name}
      email={dbUser.email}
      role={dbUser.role as StaffRole}
      department={dbUser.department}
      phone={dbUser.phone}
      lastLoginAt={dbUser.lastLoginAt}
    />
  );
}
