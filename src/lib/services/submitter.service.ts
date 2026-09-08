import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Employee } from "@/lib/db/models/Employee";
import { EmployeeStatus } from "@/types/enums";
import { ADMIN_REGISTRATIONS_FILTER } from "@/lib/services/approval-queue";
import {
  getRegistrationStatusLabel,
} from "@/features/application-status/constants";
import { toClientProps } from "@/lib/serialize/client-props";

export interface SubmitterRegistrationItem {
  _id: string;
  applicationRef: string;
  fullName: string;
  email: string;
  phone: string;
  postAppliedFor?: string;
  status: EmployeeStatus;
  statusLabel: string;
  submittedAt?: string;
  temporaryEmployeeId?: string;
  employeeId?: string;
  forwardedToAdminAt?: string;
  rejectionComment?: string;
  submittedByName?: string;
  submittedByEmail?: string;
}

function mapRegistration(emp: Record<string, unknown>): SubmitterRegistrationItem {
  const personal = emp.personalDetails as
    | { fullName?: string; postAppliedFor?: string }
    | undefined;
  const temporaryEmployeeId = emp.temporaryEmployeeId as string | undefined;
  const status = emp.status as EmployeeStatus;
  const rejectionComment =
    (emp.rejectionReason as string | undefined) ??
    (emp.correctionNotes as string | undefined);

  const statusLabel = temporaryEmployeeId
    ? `L2 Approved - Temporary Employee ID: ${temporaryEmployeeId}`
    : status === EmployeeStatus.L1_RETURNED
      ? "Reversed by L1 — Update & Resubmit"
      : status === EmployeeStatus.L2_RETURNED
        ? "Reversed by L2 — Update & Resubmit"
        : status === EmployeeStatus.L2_REVIEW
          ? "Pending L2 Approval"
          : status === EmployeeStatus.ID_GENERATED
            ? "Temporary Employee ID Generated"
            : getRegistrationStatusLabel(status);

  const submittedBy = emp.submittedBy as { name?: string; email?: string } | null | undefined;
  const snapshotName = typeof emp.submittedByName === "string" ? emp.submittedByName : undefined;
  const snapshotEmail = typeof emp.submittedByEmail === "string" ? emp.submittedByEmail : undefined;

  return toClientProps({
    _id: String(emp._id),
    applicationRef: String(emp.applicationRef),
    fullName: personal?.fullName ?? "Unknown",
    email: String(emp.email),
    phone: String(emp.phone),
    postAppliedFor: personal?.postAppliedFor,
    status,
    statusLabel,
    submittedAt: emp.submittedAt
      ? new Date(emp.submittedAt as Date).toISOString()
      : undefined,
    temporaryEmployeeId,
    employeeId: emp.employeeId as string | undefined,
    forwardedToAdminAt: emp.forwardedToAdminAt
      ? new Date(emp.forwardedToAdminAt as Date).toISOString()
      : undefined,
    rejectionComment,
    submittedByName:
      (submittedBy && typeof submittedBy === "object" && submittedBy.name
        ? submittedBy.name
        : snapshotName) || undefined,
    submittedByEmail:
      (submittedBy && typeof submittedBy === "object" && submittedBy.email
        ? submittedBy.email
        : snapshotEmail) || undefined,
  });
}

export async function getSubmitterRegistrations(
  submitterId: string
): Promise<SubmitterRegistrationItem[]> {
  await connectDB();
  const items = await Employee.find({
    submittedBy: new mongoose.Types.ObjectId(submitterId),
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return items.map(mapRegistration);
}

export async function getSubmitterRegistrationDetail(
  submitterId: string,
  employeeId: string
) {
  await connectDB();
  const employee = await Employee.findOne({
    _id: employeeId,
    submittedBy: new mongoose.Types.ObjectId(submitterId),
  }).lean();

  if (!employee) return null;

  const { getEmployeeDetailForReview } = await import(
    "@/lib/services/approval.service"
  );
  return getEmployeeDetailForReview(employeeId);
}

export async function getSubmitterReversedRegistrations(
  submitterId: string
): Promise<SubmitterRegistrationItem[]> {
  await connectDB();
  const items = await Employee.find({
    submittedBy: new mongoose.Types.ObjectId(submitterId),
    status: {
      $in: [EmployeeStatus.L1_RETURNED, EmployeeStatus.L2_RETURNED],
    },
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return items.map(mapRegistration);
}

export async function getSubmitterStats(submitterId: string) {
  await connectDB();
  const submittedBy = new mongoose.Types.ObjectId(submitterId);

  const [total, pendingL1, pendingL2, approved, reversed] = await Promise.all([
    Employee.countDocuments({ submittedBy }),
    Employee.countDocuments({
      submittedBy,
      status: { $in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW] },
    }),
    Employee.countDocuments({
      submittedBy,
      status: EmployeeStatus.L2_REVIEW,
    }),
    Employee.countDocuments({
      submittedBy,
      temporaryEmployeeId: { $exists: true, $ne: null },
    }),
    Employee.countDocuments({
      submittedBy,
      status: {
        $in: [EmployeeStatus.L1_RETURNED, EmployeeStatus.L2_RETURNED],
      },
    }),
  ]);

  return { total, pendingL1, pendingL2, approved, reversed };
}

export async function getAdminCompletedRegistrations(): Promise<
  SubmitterRegistrationItem[]
> {
  await connectDB();
  const items = await Employee.find(ADMIN_REGISTRATIONS_FILTER)
    .populate("submittedBy", "name email")
    .sort({ forwardedToAdminAt: -1 })
    .limit(100)
    .lean();

  return items.map(mapRegistration);
}

export async function getAdminRegistrationStats() {
  await connectDB();
  const [completed, pendingL1, pendingL2] = await Promise.all([
    Employee.countDocuments(ADMIN_REGISTRATIONS_FILTER),
    Employee.countDocuments({
      status: { $in: [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW] },
    }),
    Employee.countDocuments({ status: EmployeeStatus.L2_REVIEW }),
  ]);
  return { completed, pendingL1, pendingL2 };
}
