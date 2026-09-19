import { connectDB } from "@/lib/db/connect";
import { Employee } from "@/lib/db/models/Employee";
import { EmployeeStatus } from "@/types/enums";
import { ApplicationListItem } from "@/lib/services/l1.service";
import { L2_PENDING_FILTER } from "@/lib/services/approval-queue";
import { toClientProps } from "@/lib/serialize/client-props";
import {
  pickSearchableAdditional,
  pickSearchablePersonal,
} from "@/lib/ui/registration-search";

function mapEmployee(emp: Record<string, unknown>): ApplicationListItem {
  const personal = emp.personalDetails as {
    fullName?: string;
    postAppliedFor?: string;
    fatherName?: string;
    fatherOrHusbandName?: string;
    aadhaarNumber?: string;
    panNumber?: string;
  } | undefined;
  const additional = emp.additionalDetails as {
    uanNo?: string;
    esicNumber?: string;
    accountNumber?: string;
  } | undefined;
  const searchablePersonal = pickSearchablePersonal(personal);
  const searchableAdditional = pickSearchableAdditional(additional);
  const submittedBy = emp.submittedBy as { name?: string; email?: string } | null | undefined;
  const snapshotName = typeof emp.submittedByName === "string" ? emp.submittedByName : undefined;
  const snapshotEmail = typeof emp.submittedByEmail === "string" ? emp.submittedByEmail : undefined;
  const l1Decision = emp.l1Decision as
    | { decidedBy?: { name?: string } | null; approvedByName?: string }
    | undefined;
  return toClientProps({
    _id: String(emp._id),
    applicationRef: String(emp.applicationRef),
    fullName: personal?.fullName ?? "Unknown",
    email: String(emp.email),
    phone: String(emp.phone),
    postAppliedFor: personal?.postAppliedFor,
    status: emp.status as EmployeeStatus,
    submittedAt: emp.submittedAt
      ? new Date(emp.submittedAt as Date).toISOString()
      : undefined,
    employeeId: emp.employeeId as string | undefined,
    temporaryEmployeeId: emp.temporaryEmployeeId as string | undefined,
    fatherName: searchablePersonal.fatherName || undefined,
    aadhaarNumber: searchablePersonal.aadhaarNumber || undefined,
    panNumber: searchablePersonal.panNumber || undefined,
    uanNo: searchableAdditional.uanNo || undefined,
    esicNumber: searchableAdditional.esicNumber || undefined,
    accountNumber: searchableAdditional.accountNumber || undefined,
    l1ApprovedAt: emp.l1ApprovedAt
      ? new Date(emp.l1ApprovedAt as Date).toISOString()
      : undefined,
    submittedByName:
      (submittedBy && typeof submittedBy === "object" && submittedBy.name
        ? submittedBy.name
        : snapshotName) || undefined,
    submittedByEmail:
      (submittedBy && typeof submittedBy === "object" && submittedBy.email
        ? submittedBy.email
        : snapshotEmail) || undefined,
    l1ApprovedByName: l1Decision?.approvedByName || l1Decision?.decidedBy?.name,
  });
}

/**
 * Everything this L2 approver sent back or rejected.
 * "RETURN_TO_L1" has no reversed status of its own (the application goes back
 * to L1_REVIEW), so it is matched on the decision trail instead.
 */
function l2ReversedFilter(l2UserId: string) {
  return {
    $or: [
      { status: EmployeeStatus.L2_RETURNED, "l2Decision.decidedBy": l2UserId },
      { status: EmployeeStatus.REJECTED, "l2Decision.decidedBy": l2UserId },
      { "l2Decision.action": "RETURN_TO_L1", "l2Decision.decidedBy": l2UserId },
    ],
  };
}

export async function getL2Stats(l2UserId: string) {
  await connectDB();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pending, approved, rejected, forwarded, approvedThisMonth] = await Promise.all([
    Employee.countDocuments(L2_PENDING_FILTER),
    Employee.countDocuments({
      "l2Decision.action": { $in: ["APPROVE", "FORWARD"] },
      "l2Decision.decidedBy": l2UserId,
    }),
    Employee.countDocuments(l2ReversedFilter(l2UserId)),
    Employee.countDocuments({
      forwardedToAdminAt: { $exists: true },
      "l2Decision.decidedBy": l2UserId,
    }),
    Employee.countDocuments({
      "l2Decision.action": { $in: ["APPROVE", "FORWARD"] },
      "l2Decision.decidedBy": l2UserId,
      "l2Decision.decidedAt": { $gte: startOfMonth },
    }),
  ]);

  return { pending, approved, rejected, forwarded, approvedThisMonth };
}

export async function getL2PendingApplications(): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find(L2_PENDING_FILTER)
    .populate("submittedBy", "name email")
    .populate("l1Decision.decidedBy", "name")
    .sort({ l1ApprovedAt: -1 })
    .limit(50)
    .lean();

  return items.map(mapEmployee);
}

export async function getL2ApprovedApplications(
  l2UserId: string
): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find({
    "l2Decision.action": { $in: ["APPROVE", "FORWARD"] },
    "l2Decision.decidedBy": l2UserId,
  })
    .populate("submittedBy", "name email")
    .populate("l1Decision.decidedBy", "name")
    .sort({ approvedAt: -1 })
    .limit(50)
    .lean();

  return items.map(mapEmployee);
}

export async function getL2RejectedApplications(
  l2UserId: string
): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find(l2ReversedFilter(l2UserId))
    .populate("submittedBy", "name email")
    .populate("l1Decision.decidedBy", "name")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return items.map(mapEmployee);
}

export async function getL2AllApprovedRegistrations(): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find({
    status: {
      $in: [
        EmployeeStatus.APPROVED,
        EmployeeStatus.ID_GENERATED,
        EmployeeStatus.ID_CARD_ISSUED,
      ],
    },
    temporaryEmployeeId: { $exists: true, $ne: null },
    "l2Decision.action": { $in: ["APPROVE", "FORWARD"] },
  })
    .populate("submittedBy", "name email")
    .populate("l1Decision.decidedBy", "name")
    .sort({ approvedAt: -1, forwardedToAdminAt: -1 })
    .limit(200)
    .lean();

  return items.map(mapEmployee);
}

export async function getL2RecentPending(limit = 5): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find(L2_PENDING_FILTER)
    .populate("submittedBy", "name email")
    .populate("l1Decision.decidedBy", "name")
    .sort({ l1ApprovedAt: -1 })
    .limit(limit)
    .lean();

  return items.map(mapEmployee);
}
