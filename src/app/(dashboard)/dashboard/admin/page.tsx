import Link from "next/link";
import { ArrowRight, CheckCircle, Clock3, Users, Layers } from "lucide-react";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { listStaffUsers } from "@/lib/services/admin.service";
import { getAdminRegistrationStats } from "@/lib/services/submitter.service";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";
import {
  DashboardPageHeader,
  DashboardStatCard,
} from "@/components/dashboard/DashboardUi";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  await requireStaffAuth(UserRole.ADMIN);
  const [regStats, submitters] = await Promise.all([
    getAdminRegistrationStats(),
    listStaffUsers(),
  ]);

  const activeUsers = submitters.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Administration"
        description="Manage staff users and L2-approved registrations."
        actions={<DownloadExcelButton scope="admin" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Approved"
          value={regStats.completed}
          description="L2 approved registrations"
          href="/dashboard/admin/registrations"
          linkLabel="View registrations"
          tone="green"
          icon={CheckCircle}
        />
        <DashboardStatCard
          title="Pending L1"
          value={regStats.pendingL1}
          description="Awaiting first-level review"
          href="/dashboard/admin/registrations/pending-l1"
          linkLabel="View pending L1"
          tone="blue"
          icon={Clock3}
        />
        <DashboardStatCard
          title="Pending L2"
          value={regStats.pendingL2}
          description="Awaiting final approval"
          href="/dashboard/admin/registrations/pending-l2"
          linkLabel="View pending L2"
          tone="slate"
          icon={Layers}
        />
        <DashboardStatCard
          title="Active staff"
          value={`${activeUsers}/${submitters.length}`}
          description="Staff accounts in the portal"
          href="/dashboard/admin/users"
          linkLabel="Manage users"
          tone="default"
          icon={Users}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/admin/registrations"
          className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#15803D]">
              <CheckCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-primary">Approved Registrations</p>
              <p className="text-xs text-[#64748B]">Excel export & document folders</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#1D4ED8]" />
        </Link>
        <Link
          href="/dashboard/admin/users"
          className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-primary">User Management</p>
              <p className="text-xs text-[#64748B]">Create and manage staff accounts</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#1D4ED8]" />
        </Link>
      </div>
    </div>
  );
}
