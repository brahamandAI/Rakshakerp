import { UserRole } from "@/types/enums";

export interface AttendanceAccessRecord {
  uploadedById: string;
  payrollManagerId: string;
  payrollExecutiveId: string | null;
}

export interface AttendanceActor {
  id: string;
  role: string;
}

export function canReadAttendance(
  actor: AttendanceActor,
  record: AttendanceAccessRecord
): boolean {
  if (actor.role === UserRole.SUBMITTER) {
    return record.uploadedById === actor.id;
  }
  if (actor.role === UserRole.PAYROLL_MANAGER) {
    return record.payrollManagerId === actor.id;
  }
  if (actor.role === UserRole.PAYROLL_EXECUTIVE) {
    return (
      record.payrollExecutiveId !== null &&
      record.payrollExecutiveId === actor.id
    );
  }
  return false;
}

export function canForwardAttendance(
  actor: AttendanceActor,
  record: AttendanceAccessRecord,
  executive: { id: string; role: string; assignedPayrollManagerId: string | null }
): boolean {
  if (actor.role !== UserRole.PAYROLL_MANAGER) return false;
  if (record.payrollManagerId !== actor.id) return false;
  if (executive.role !== UserRole.PAYROLL_EXECUTIVE) return false;
  return executive.assignedPayrollManagerId === actor.id;
}
