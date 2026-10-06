export enum NotificationType {
  APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED",
  L1_APPROVED = "L1_APPROVED",
  L2_APPROVED = "L2_APPROVED",
  CORRECTION_REQUIRED = "CORRECTION_REQUIRED",
  REJECTED = "REJECTED",
  ID_CARD_GENERATED = "ID_CARD_GENERATED",
  /** Internal: forwarded to support queue */
  FORWARDED_TO_SUPPORT = "FORWARDED_TO_SUPPORT",
}

export type NotificationRecipientType = "STAFF" | "EMPLOYEE";

export interface NotificationViewModel {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
  linkUrl?: string;
  applicationRef?: string;
  employeeId?: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { label: string; badgeClass: string }
> = {
  [NotificationType.APPLICATION_SUBMITTED]: {
    label: "Application Submitted",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  [NotificationType.L1_APPROVED]: {
    label: "L1 Approved",
    badgeClass: "bg-purple-100 text-purple-800",
  },
  [NotificationType.L2_APPROVED]: {
    label: "L2 Approved",
    badgeClass: "bg-green-100 text-green-800",
  },
  [NotificationType.CORRECTION_REQUIRED]: {
    label: "Correction Required",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  [NotificationType.REJECTED]: {
    label: "Rejected",
    badgeClass: "bg-red-100 text-red-800",
  },
  [NotificationType.ID_CARD_GENERATED]: {
    label: "ID Card Generated",
    badgeClass: "bg-primary/10 text-primary",
  },
  [NotificationType.FORWARDED_TO_SUPPORT]: {
    label: "Forwarded to Support",
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
};

export const STAFF_NOTIFICATIONS_PATH: Record<string, string> = {
  SUBMITTER: "/dashboard/submitter/notifications",
  L1: "/dashboard/l1/notifications",
  L2: "/dashboard/l2/notifications",
  SCANNING: "/dashboard/scanning/notifications",
  SUPPORT: "/dashboard/support/notifications",
  ADMIN: "/dashboard/admin/notifications",
};

export const EMPLOYEE_NOTIFICATIONS_PATH = "/application/notifications";
