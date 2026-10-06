import { prisma } from "@/lib/db/prisma";
import { EmployeeStatus } from "@/types/enums";
import {
  ApplicationStatusData,
  buildTimeline,
  resolveDisplayStatus,
  DISPLAY_STATUS_CONFIG,
} from "@/features/application-status/constants";
import { asRecord } from "@/lib/services/approval-queue";

export async function getApplicationStatus(
  employeeId: string
): Promise<ApplicationStatusData | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return null;

  const personalDetails = asRecord(employee.personalDetails) as {
    fullName?: string;
    postAppliedFor?: string;
  } | null;

  const idCard = await prisma.idCard.findFirst({
    where: {
      employeeId: employee.id,
      status: "ACTIVE",
    },
    orderBy: { generatedAt: "desc" },
  });

  const editableStatuses = [
    EmployeeStatus.DRAFT,
    EmployeeStatus.L1_RETURNED,
    EmployeeStatus.L2_RETURNED,
  ];

  const displayStatus = resolveDisplayStatus(employee.status as EmployeeStatus);
  const config = DISPLAY_STATUS_CONFIG[displayStatus];

  const rejectionReason =
    employee.status === EmployeeStatus.REJECTED
      ? employee.rejectionReason
      : undefined;

  return {
    applicationRef: employee.applicationRef,
    fullName: personalDetails?.fullName ?? "Applicant",
    email: employee.email,
    phone: employee.phone,
    postAppliedFor: personalDetails?.postAppliedFor,
    status: employee.status as EmployeeStatus,
    displayStatus,
    displayLabel: config.label,
    displayDescription: config.description,
    employeeId: employee.employeeId ?? undefined,
    submittedAt: employee.submittedAt?.toISOString(),
    correctionNotes: employee.correctionNotes ?? undefined,
    rejectionReason: rejectionReason ?? undefined,
    timeline: buildTimeline(employee.status as EmployeeStatus, {
      submittedAt: employee.submittedAt ?? undefined,
      createdAt: employee.createdAt,
      idCardGeneratedAt: idCard?.generatedAt,
    }),
    idCard: idCard
      ? {
          url: idCard.downloadUrl ?? idCard.url,
          format: (idCard.format === "PNG" ? "PNG" : "PDF") as "PDF" | "PNG",
          generatedAt: idCard.generatedAt.toISOString(),
        }
      : undefined,
    canEdit: editableStatuses.includes(employee.status as EmployeeStatus),
    editUrl: editableStatuses.includes(employee.status as EmployeeStatus)
      ? `/apply`
      : undefined,
  };
}

export async function getEmployeeRedirectPath(
  employeeId: string
): Promise<string> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { status: true },
  });
  if (!employee) return "/apply";

  const editableStatuses = [
    EmployeeStatus.DRAFT,
    EmployeeStatus.L1_RETURNED,
    EmployeeStatus.L2_RETURNED,
  ];

  if (editableStatuses.includes(employee.status as EmployeeStatus)) {
    return `/apply`;
  }

  return "/apply";
}
