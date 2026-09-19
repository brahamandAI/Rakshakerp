import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";
import { ProfileEditForm } from "@/features/admin/components/ProfileEditForm";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";

export const metadata = { title: "Profile | Admin" };

export default async function AdminProfilePage() {
  const { user } = await requireStaffAuth(UserRole.ADMIN);

  await connectDB();
  const dbUser = await User.findById(user.id).lean();

  if (!dbUser) {
    return <p>User not found.</p>;
  }

  return (
    <div className="space-y-6">
      <DashboardBackLink href="/dashboard/admin" />
      <div>
        <h2 className="font-heading text-2xl font-bold text-primary">Profile</h2>
        <p className="text-[#64748B]">Update your account details and password.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ProfileEditForm
          user={{
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            department: dbUser.department,
            phone: dbUser.phone,
            lastLoginAt: dbUser.lastLoginAt?.toISOString(),
          }}
        />
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
