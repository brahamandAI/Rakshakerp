import { notFound } from "next/navigation";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import { AttendanceFileDetail } from "@/features/attendance/components/AttendanceFileDetail";
import {
  AttendanceError,
  getAttendanceDetail,
} from "@/lib/services/attendance.service";

export const metadata = { title: "Attendance | Submitter" };
export const dynamic = "force-dynamic";

export default async function SubmitterAttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireStaffAuth(UserRole.SUBMITTER);
  const { id } = await params;

  try {
    const record = await getAttendanceDetail(user, id);
    return (
      <AttendanceFileDetail
        backHref="/dashboard/submitter/attendance"
        fileId={record.id}
        fileName={record.fileName}
        fileTypeLabel={record.fileTypeLabel}
        status={record.status}
        statusLabel={record.statusLabel}
        submittedBy={record.submittedBy}
        payrollManagerName={record.payrollManagerName}
        payrollExecutiveName={record.payrollExecutiveName || undefined}
        uploadedAtLabel={record.uploadedAtLabel}
        forwardedAtLabel={record.forwardedAtLabel}
        canPreview={record.canPreview}
        showSubmitter={false}
      />
    );
  } catch (error) {
    if (error instanceof AttendanceError && error.status === 404) notFound();
    throw error;
  }
}
