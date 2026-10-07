import { MAX_FILE_SIZE } from "@/features/onboarding/constants";
import { UserRole } from "@/types/enums";

export enum AttendanceStatus {
  UPLOADED = "UPLOADED",
  SUBMITTED_TO_PAYROLL_MANAGER = "SUBMITTED_TO_PAYROLL_MANAGER",
  FORWARDED_TO_PAYROLL_EXECUTIVE = "FORWARDED_TO_PAYROLL_EXECUTIVE",
}

export const ATTENDANCE_AUDIT = {
  UPLOADED: "ATTENDANCE_UPLOADED",
  VIEWED: "ATTENDANCE_VIEWED",
  DOWNLOADED: "ATTENDANCE_DOWNLOADED",
  FORWARDED: "ATTENDANCE_FORWARDED",
} as const;

export const ATTENDANCE_MAX_BYTES = MAX_FILE_SIZE;

export const ATTENDANCE_ACCEPT = ".xlsx,.xls,.pdf,.doc,.docx";

export type AttendanceFileKind = "EXCEL" | "PDF" | "WORD";

export type AttendanceViewer = "submitter" | "manager" | "executive";

const FILE_KIND_LABEL: Record<AttendanceFileKind, string> = {
  EXCEL: "Excel",
  PDF: "PDF",
  WORD: "Word",
};

export function attendanceFileKindLabel(fileType: string): string {
  if (fileType in FILE_KIND_LABEL) {
    return FILE_KIND_LABEL[fileType as AttendanceFileKind];
  }
  return fileType;
}

export function attendanceCanPreview(fileType: string): boolean {
  return fileType === "PDF";
}

export function viewerForRole(role: string): AttendanceViewer | null {
  if (role === UserRole.SUBMITTER) return "submitter";
  if (role === UserRole.PAYROLL_MANAGER) return "manager";
  if (role === UserRole.PAYROLL_EXECUTIVE) return "executive";
  return null;
}

export function attendanceStatusLabel(
  status: string,
  viewer: AttendanceViewer
): string {
  if (viewer === "executive") return "Received";
  if (status === AttendanceStatus.FORWARDED_TO_PAYROLL_EXECUTIVE) {
    return "Forwarded to Payroll Executive";
  }
  if (viewer === "manager") return "Received";
  return "Submitted to Payroll Manager";
}

export function attendanceStatusClass(status: string): string {
  if (status === AttendanceStatus.FORWARDED_TO_PAYROLL_EXECUTIVE) {
    return "bg-indigo-100 text-indigo-800";
  }
  return "bg-sky-100 text-sky-800";
}

export function formatAttendanceDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}
