import { notFound } from "next/navigation";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getEmployeeDetailForReview } from "@/lib/services/approval.service";
import { RegistrationDetailReadOnly } from "@/features/submitter/components/RegistrationDetailReadOnly";
import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";
import { DownloadExcelButton } from "@/features/export/components/DownloadExcelButton";
import {
  clientHistoryItems,
  serializeRegistrationDocuments,
  serializeRegistrationEmployee,
} from "@/lib/serialize/client-props";

export const metadata = { title: "Registration Details | Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRegistrationDetailPage({ params }: PageProps) {
  await requireStaffAuth(UserRole.ADMIN);
  const { id } = await params;
  const data = await getEmployeeDetailForReview(id);
  if (!data) notFound();

  const { employee, documents, history } = data;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardBackLink href="/dashboard/admin/registrations" />
        <DownloadExcelButton
          scope="admin"
          employeeId={String(employee._id)}
          label="Download Excel"
        />
      </div>
      <RegistrationDetailReadOnly
        employeeId={String(employee._id)}
        showDocumentsFolder
        employee={serializeRegistrationEmployee(employee)}
        documents={serializeRegistrationDocuments(documents)}
        history={clientHistoryItems(history)}
      />
    </div>
  );
}
