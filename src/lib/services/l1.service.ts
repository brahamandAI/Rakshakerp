import { connectDB } from "@/lib/db/connect";
import { Employee } from "@/lib/db/models/Employee";
import { EmployeeStatus } from "@/types/enums";
import { L1_PENDING_FILTER } from "@/lib/services/approval-queue";
import { toClientProps } from "@/lib/serialize/client-props";
import {
  pickSearchableAdditional,
  pickSearchablePersonal,
} from "@/lib/ui/registration-search";

export interface ApplicationListItem {
  _id: string;
  applicationRef: string;
  fullName: string;
  email: string;
  phone: string;
  postAppliedFor?: string;
  status: EmployeeStatus;
  submittedAt?: string;
  employeeId?: string;
  temporaryEmployeeId?: string;
  fatherName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  uanNo?: string;
  esicNumber?: string;
  accountNumber?: string;
  l1ApprovedAt?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  l1ApprovedByName?: string;
  /** Note L2 left when sending the application back to L1 */
  l2ReverseNote?: string;
  l2ReversedAt?: string;
  l2ReversedByName?: string;
}

/**
 * Applications L2 sent back to L1 for re-review. The L2 trail is kept until L1
 * approves again, so these stay listed while they await a fresh L1 decision.
 */
export const L1_REVERSED_FROM_L2_FILTER = {
  "l2Decision.action": "RETURN_TO_L1",
  status: { $in: [EmployeeStatus.L1_REVIEW, EmployeeStatus.SUBMITTED] },
};

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
  const l2Decision = emp.l2Decision as
    | {
        action?: string;
        comment?: string;
        decidedAt?: Date;
        decidedBy?: { name?: string } | null;
      }
    | undefined;
  const isL2Reversal = l2Decision?.action === "RETURN_TO_L1";
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
    l2ReverseNote: isL2Reversal
      ? (l2Decision?.comment ?? (emp.correctionNotes as string | undefined))
      : undefined,
    l2ReversedAt:
      isL2Reversal && l2Decision?.decidedAt
        ? new Date(l2Decision.decidedAt).toISOString()
        : undefined,
    l2ReversedByName: isL2Reversal ? l2Decision?.decidedBy?.name : undefined,
  });
}

export async function getL1Stats(l1UserId: string) {
  await connectDB();

  const [pending, approved, rejected, returnedToday, reversedFromL2] = await Promise.all([
    Employee.countDocuments(L1_PENDING_FILTER),
    Employee.countDocuments({
      "l1Decision.action": "APPROVE",
      "l1Decision.decidedBy": l1UserId,
    }),
    Employee.countDocuments({
      $or: [
        { status: EmployeeStatus.L1_RETURNED, "l1Decision.decidedBy": l1UserId },
        {
          status: EmployeeStatus.L2_RETURNED,
          "l1Decision.action": "APPROVE",
          "l1Decision.decidedBy": l1UserId,
        },
        { status: EmployeeStatus.REJECTED, "l1Decision.decidedBy": l1UserId },
      ],
    }),
    Employee.countDocuments({
      status: EmployeeStatus.L1_RETURNED,
      "l1Decision.decidedBy": l1UserId,
      "l1Decision.decidedAt": {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    }),
    Employee.countDocuments(L1_REVERSED_FROM_L2_FILTER),
  ]);

  return { pending, approved, rejected, returnedToday, reversedFromL2 };
}

/** Applications reversed by L2 and waiting for a fresh L1 review. */
export async function getL1ReversedFromL2Applications(): Promise<
  ApplicationListItem[]
> {
  await connectDB();
  const items = await Employee.find(L1_REVERSED_FROM_L2_FILTER)
    .populate("submittedBy", "name email")
    .populate("l2Decision.decidedBy", "name")
    .sort({ "l2Decision.decidedAt": -1, updatedAt: -1 })
    .limit(50)
    .lean();

  return items.map(mapEmployee);
}

export async function getL1PendingApplications(): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find(L1_PENDING_FILTER)
    .populate("submittedBy", "name email")
    .sort({ submittedAt: -1 })
    .limit(50)
    .lean();

  return items.map(mapEmployee);
}

export async function getL1ApprovedApplications(
  l1UserId: string
): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find({
    "l1Decision.action": "APPROVE",
    "l1Decision.decidedBy": l1UserId,
  })
    .populate("submittedBy", "name email")
    .sort({ l1ApprovedAt: -1 })
    .limit(50)
    .lean();

  return items.map(mapEmployee);
}

export async function getL1RejectedApplications(
  l1UserId: string
): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find({
    $or: [
      { status: EmployeeStatus.L1_RETURNED, "l1Decision.decidedBy": l1UserId },
      {
        status: EmployeeStatus.L2_RETURNED,
        "l1Decision.action": "APPROVE",
        "l1Decision.decidedBy": l1UserId,
      },
      { status: EmployeeStatus.REJECTED, "l1Decision.decidedBy": l1UserId },
    ],
  })
    .populate("submittedBy", "name email")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return items.map(mapEmployee);
}

export async function getL1AllApprovedRegistrations(): Promise<ApplicationListItem[]> {
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
    "l1Decision.action": "APPROVE",
  })
    .populate("submittedBy", "name email")
    .sort({ approvedAt: -1, l1ApprovedAt: -1 })
    .limit(200)
    .lean();

  return items.map(mapEmployee);
}

export async function getL1RecentPending(limit = 5): Promise<ApplicationListItem[]> {
  await connectDB();
  const items = await Employee.find(L1_PENDING_FILTER)
    .populate("submittedBy", "name email")
    .sort({ submittedAt: -1 })
    .limit(limit)
    .lean();

  return items.map(mapEmployee);
}
