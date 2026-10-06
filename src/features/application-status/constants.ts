import { EmployeeStatus } from "@/types/enums";

export const REGISTRATION_STATUS_LABELS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.DRAFT]: "Draft",
  [EmployeeStatus.SUBMITTED]: "Pending L1 Approval",
  [EmployeeStatus.L1_REVIEW]: "Pending L1 Approval",
  [EmployeeStatus.L1_RETURNED]: "Reversed by L1",
  [EmployeeStatus.L2_REVIEW]: "Pending L2 Approval",
  [EmployeeStatus.L2_RETURNED]: "Reversed by L2",
  [EmployeeStatus.APPROVED]: "L2 Approved",
  [EmployeeStatus.ID_GENERATED]: "Pending Scanning",
  [EmployeeStatus.SCANNING_COMPLETED]: "Scanning Completed",
  [EmployeeStatus.ID_CARD_ISSUED]: "Completed",
  [EmployeeStatus.REJECTED]: "Rejected",
};

export const APPROVAL_STAGE_LABELS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.DRAFT]: "Registration",
  [EmployeeStatus.SUBMITTED]: "Pending L1 Approval",
  [EmployeeStatus.L1_REVIEW]: "Pending L1 Approval",
  [EmployeeStatus.L1_RETURNED]: "Reversed (L1)",
  [EmployeeStatus.L2_REVIEW]: "Pending L2 Approval",
  [EmployeeStatus.L2_RETURNED]: "Reversed (L2)",
  [EmployeeStatus.APPROVED]: "L2 Approved",
  [EmployeeStatus.ID_GENERATED]: "Pending Scanning",
  [EmployeeStatus.SCANNING_COMPLETED]: "Scanning Completed",
  [EmployeeStatus.ID_CARD_ISSUED]: "Completed",
  [EmployeeStatus.REJECTED]: "Closed",
};

export function getRegistrationStatusLabel(status: EmployeeStatus): string {
  return REGISTRATION_STATUS_LABELS[status] ?? "In Progress";
}

export function getApprovalStageLabel(status: EmployeeStatus): string {
  return APPROVAL_STAGE_LABELS[status] ?? "In Progress";
}

export type EmployeeDisplayStatus =
  | "PENDING"
  | "L1_APPROVED"
  | "L2_APPROVED"
  | "REJECTED"
  | "CORRECTION_REQUIRED"
  | "ID_CARD_GENERATED";

export type TimelineStepState = "completed" | "current" | "pending" | "error";

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  state: TimelineStepState;
  date?: string;
}

export interface ApplicationStatusData {
  applicationRef: string;
  fullName: string;
  email: string;
  phone: string;
  postAppliedFor?: string;
  status: EmployeeStatus;
  displayStatus: EmployeeDisplayStatus;
  displayLabel: string;
  displayDescription: string;
  employeeId?: string;
  submittedAt?: string;
  correctionNotes?: string;
  rejectionReason?: string;
  timeline: TimelineStep[];
  idCard?: {
    url: string;
    format: "PDF" | "PNG";
    generatedAt: string;
  };
  canEdit: boolean;
  editUrl?: string;
}

export const DISPLAY_STATUS_CONFIG: Record<
  EmployeeDisplayStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    iconBg: string;
  }
> = {
  PENDING: {
    label: "Pending L1 Approval",
    description: "Your application is awaiting L1 review.",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    iconBg: "bg-blue-100 text-blue-700",
  },
  L1_APPROVED: {
    label: "L1 Approved",
    description: "Your application has been approved by L1. Awaiting L2 review.",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    iconBg: "bg-purple-100 text-purple-700",
  },
  L2_APPROVED: {
    label: "L2 Approved",
    description: "Your application has been approved by L2. ID card processing will begin shortly.",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    iconBg: "bg-green-100 text-green-700",
  },
  REJECTED: {
    label: "Rejected",
    description: "Unfortunately, your application was not approved.",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    iconBg: "bg-red-100 text-red-700",
  },
  CORRECTION_REQUIRED: {
    label: "Correction Required",
    description: "Please update your application and resubmit.",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
  },
  ID_CARD_GENERATED: {
    label: "Completed",
    description: "Your employee ID card has been generated and is ready to download.",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    iconBg: "bg-accent/20 text-primary",
  },
};

export function resolveDisplayStatus(status: EmployeeStatus): EmployeeDisplayStatus {
  switch (status) {
    case EmployeeStatus.SUBMITTED:
    case EmployeeStatus.L1_REVIEW:
      return "PENDING";
    case EmployeeStatus.L2_REVIEW:
      return "L1_APPROVED";
    case EmployeeStatus.APPROVED:
    case EmployeeStatus.ID_GENERATED:
      return "L2_APPROVED";
    case EmployeeStatus.ID_CARD_ISSUED:
      return "ID_CARD_GENERATED";
    case EmployeeStatus.L1_RETURNED:
    case EmployeeStatus.L2_RETURNED:
      return "CORRECTION_REQUIRED";
    case EmployeeStatus.REJECTED:
      return "REJECTED";
    default:
      return "PENDING";
  }
}

export function buildTimeline(
  status: EmployeeStatus,
  dates: {
    submittedAt?: Date;
    createdAt?: Date;
    idCardGeneratedAt?: Date;
  }
): TimelineStep[] {
  const submitted = dates.submittedAt ?? dates.createdAt;
  const fmt = (d?: Date) =>
    d
      ? d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : undefined;

  const order = getStatusOrder(status);

  const steps: Omit<TimelineStep, "state">[] = [
    {
      id: "submitted",
      title: "Application Submitted",
      description: "Your enrollment form was received",
      date: fmt(submitted),
    },
    {
      id: "l1_review",
      title: "L1 Review",
      description: "First-level verification in progress",
    },
    {
      id: "l1_approved",
      title: "L1 Approved",
      description: "Initial review passed successfully",
    },
    {
      id: "l2_review",
      title: "L2 Review",
      description: "Final approval in progress",
    },
    {
      id: "l2_approved",
      title: "L2 Approved",
      description: "Application fully approved",
    },
    {
      id: "id_generated",
      title: "Employee ID Assigned",
      description: "Your company employee ID has been issued",
    },
    {
      id: "id_card",
      title: "ID Card Generated",
      description: "Digital ID card is ready for download",
      date: fmt(dates.idCardGeneratedAt),
    },
  ];

  if (status === EmployeeStatus.REJECTED) {
    return steps.map((step, i) => ({
      ...step,
      state: i === 0 ? "completed" : i === 1 ? "error" : "pending",
    }));
  }

  if (
    status === EmployeeStatus.L1_RETURNED ||
    status === EmployeeStatus.L2_RETURNED
  ) {
    const errorIndex = status === EmployeeStatus.L1_RETURNED ? 1 : 3;
    return steps.map((step, i) => {
      if (i < errorIndex) return { ...step, state: "completed" as const };
      if (i === errorIndex) return { ...step, state: "error" as const };
      return { ...step, state: "pending" as const };
    });
  }

  return steps.map((step, i) => {
    const stepOrder = i + 1;
    if (stepOrder < order) return { ...step, state: "completed" as const };
    if (stepOrder === order) return { ...step, state: "current" as const };
    return { ...step, state: "pending" as const };
  });
}

function getStatusOrder(status: EmployeeStatus): number {
  switch (status) {
    case EmployeeStatus.SUBMITTED:
      return 2;
    case EmployeeStatus.L1_REVIEW:
      return 2;
    case EmployeeStatus.L2_REVIEW:
      return 4;
    case EmployeeStatus.APPROVED:
      return 5;
    case EmployeeStatus.ID_GENERATED:
      return 6;
    case EmployeeStatus.ID_CARD_ISSUED:
      return 7;
    default:
      return 1;
  }
}
