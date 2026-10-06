import { EmployeeStatus } from "@/types/enums";
import { REGISTRATION_STATUS_LABELS } from "@/features/application-status/constants";

/**
 * UI-only grouping of existing EmployeeStatus values for list filters.
 * Does not invent statuses — each option maps to real enum values.
 */
export const APPROVAL_STATUS_FILTERS: Array<{
  value: string;
  label: string;
  statuses: EmployeeStatus[];
}> = [
  { value: "all", label: "All", statuses: [] },
  {
    value: "pending_l1",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.SUBMITTED],
    statuses: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW],
  },
  {
    value: "reversed_l1",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.L1_RETURNED],
    statuses: [EmployeeStatus.L1_RETURNED],
  },
  {
    value: "pending_l2",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.L2_REVIEW],
    statuses: [EmployeeStatus.L2_REVIEW],
  },
  {
    value: "reversed_l2",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.L2_RETURNED],
    statuses: [EmployeeStatus.L2_RETURNED],
  },
  {
    value: "l2_approved",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.APPROVED],
    statuses: [
      EmployeeStatus.APPROVED,
      EmployeeStatus.ID_GENERATED,
      EmployeeStatus.SCANNING_COMPLETED,
      EmployeeStatus.ID_CARD_ISSUED,
    ],
  },
  {
    value: "scanning_pending",
    label: "Pending Scanning",
    statuses: [EmployeeStatus.ID_GENERATED],
  },
  {
    value: "scanning_completed",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.SCANNING_COMPLETED],
    statuses: [EmployeeStatus.SCANNING_COMPLETED],
  },
  {
    value: "rejected",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.REJECTED],
    statuses: [EmployeeStatus.REJECTED],
  },
  {
    value: "draft",
    label: REGISTRATION_STATUS_LABELS[EmployeeStatus.DRAFT],
    statuses: [EmployeeStatus.DRAFT],
  },
];

export function matchesApprovalStatusFilter(
  status: EmployeeStatus,
  filter: string
): boolean {
  if (!filter || filter === "all") return true;
  const option = APPROVAL_STATUS_FILTERS.find((item) => item.value === filter);
  if (!option) return status === filter;
  if (option.statuses.length === 0) return true;
  return option.statuses.includes(status);
}

export const APPROVAL_STATUS_SELECT_OPTIONS = APPROVAL_STATUS_FILTERS.map(
  (item) => ({ value: item.value, label: item.label })
);
