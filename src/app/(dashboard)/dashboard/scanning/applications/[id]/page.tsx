import { notFound } from "next/navigation";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { getEmployeeDetailForReview } from "@/lib/services/approval.service";
import { EmployeeDetailView } from "@/features/l2/components/EmployeeDetailView";
import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";
import { mapReviewDocuments } from "@/features/documents/utils/map-review-documents";
import {
  clientHistoryItems,
  serializeReviewEmployee,
} from "@/lib/serialize/client-props";

export const metadata = { title: "Application Details | Scanning" };

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScanningEmployeeDetailPage({ params }: PageProps) {
  await requireStaffAuth(UserRole.SCANNING);
  const { id } = await params;
  const data = await getEmployeeDetailForReview(id);

  if (!data) {
    notFound();
  }

  const { employee, documents, history } = data;

  return (
    <div className="space-y-4">
      <DashboardBackLink href="/dashboard/scanning/applications/pending" />
      <EmployeeDetailView
        employee={serializeReviewEmployee(employee)}
        documents={mapReviewDocuments(documents)}
        history={clientHistoryItems(history)}
        reviewMode="scanning"
      />
    </div>
  );
}
