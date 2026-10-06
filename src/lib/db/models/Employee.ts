import mongoose, { Schema, Document, Model } from "mongoose";
import { EmployeeStatus } from "@/types/enums";
import { ONBOARDING_TOTAL_STEPS } from "@/features/onboarding/constants";

export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  applicationRef: string;
  status: EmployeeStatus;
  employeeId?: string;
  temporaryEmployeeId?: string;
  email: string;
  phone: string;
  personalDetails?: Record<string, unknown>;
  address?: Record<string, unknown>;
  education?: Record<string, unknown>;
  references?: Record<string, unknown>[];
  familyDetails?: Record<string, unknown>[];
  nominee?: Record<string, unknown>;
  exServiceman?: Record<string, unknown>;
  gunman?: Record<string, unknown>;
  additionalDetails?: Record<string, unknown>;
  declaration?: Record<string, unknown>;
  currentStep: number;
  completedSteps: number[];
  correctionNotes?: string;
  correctionSteps?: number[];
  rejectionReason?: string;
  submittedSnapshot?: Record<string, unknown>;
  pendingFieldChanges?: Array<{
    path: string;
    label: string;
    oldValue: string;
    newValue: string;
  }>;
  submittedBy?: mongoose.Types.ObjectId;
  submittedByName?: string;
  submittedByEmail?: string;
  assignedL1Id?: mongoose.Types.ObjectId;
  l1Decision?: {
    action: "APPROVE" | "REJECT" | "RETURN";
    comment?: string;
    /** Name typed by the L1 reviewer at approval time */
    approvedByName?: string;
    decidedBy: mongoose.Types.ObjectId;
    decidedAt: Date;
  };
  submittedAt?: Date;
  l1ApprovedAt?: Date;
  approvedAt?: Date;
  idGeneratedAt?: Date;
  assignedL2Id?: mongoose.Types.ObjectId;
  l2Decision?: {
    action: "APPROVE" | "REJECT" | "RETURN" | "RETURN_TO_L1" | "FORWARD";
    comment?: string;
    decidedBy: mongoose.Types.ObjectId;
    decidedAt: Date;
  };
  scanningDecision?: {
    action: "APPROVE";
    scanningCompleted: boolean;
    comment?: string;
    decidedBy: mongoose.Types.ObjectId;
    decidedAt: Date;
  };
  scanningCompletedAt?: Date;
  forwardedToSupportAt?: Date;
  forwardedToAdminAt?: Date;
  lastSavedAt?: Date;
  /** Logical + Cloudinary folder created after L2 approval + temp ID */
  documentsFolder?: {
    folderName: string;
    folderPath: string;
    cloudinaryFolder: string;
    documentCount: number;
    temporaryEmployeeId: string;
    employeeName: string;
    organizedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    applicationRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      default: EmployeeStatus.DRAFT,
    },
    employeeId: { type: String, sparse: true, unique: true },
    temporaryEmployeeId: { type: String, sparse: true, unique: true, index: true },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone: { type: String, required: true, trim: true },
    personalDetails: { type: Schema.Types.Mixed, default: {} },
    address: { type: Schema.Types.Mixed, default: {} },
    education: { type: Schema.Types.Mixed, default: {} },
    references: { type: [Schema.Types.Mixed], default: [] },
    familyDetails: { type: [Schema.Types.Mixed], default: [] },
    nominee: { type: Schema.Types.Mixed, default: {} },
    exServiceman: { type: Schema.Types.Mixed, default: {} },
    gunman: { type: Schema.Types.Mixed, default: {} },
    additionalDetails: { type: Schema.Types.Mixed, default: {} },
    declaration: { type: Schema.Types.Mixed, default: {} },
    currentStep: { type: Number, default: 1, min: 1, max: ONBOARDING_TOTAL_STEPS },
    completedSteps: { type: [Number], default: [] },
    correctionNotes: { type: String },
    correctionSteps: { type: [Number], default: [] },
    rejectionReason: { type: String },
    submittedSnapshot: { type: Schema.Types.Mixed },
    pendingFieldChanges: {
      type: [
        {
          path: { type: String },
          label: { type: String },
          oldValue: { type: String },
          newValue: { type: String },
        },
      ],
      default: [],
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    submittedByName: { type: String, trim: true },
    submittedByEmail: { type: String, trim: true, lowercase: true },
    assignedL1Id: { type: Schema.Types.ObjectId, ref: "User", index: true },
    l1Decision: {
      action: { type: String, enum: ["APPROVE", "REJECT", "RETURN"] },
      comment: { type: String },
      approvedByName: { type: String, trim: true },
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: { type: Date },
    },
    submittedAt: { type: Date },
    l1ApprovedAt: { type: Date },
    approvedAt: { type: Date },
    idGeneratedAt: { type: Date },
    assignedL2Id: { type: Schema.Types.ObjectId, ref: "User", index: true },
    l2Decision: {
      action: {
        type: String,
        enum: ["APPROVE", "REJECT", "RETURN", "RETURN_TO_L1", "FORWARD"],
      },
      comment: { type: String },
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: { type: Date },
    },
    scanningDecision: {
      action: { type: String, enum: ["APPROVE"] },
      scanningCompleted: { type: Boolean },
      comment: { type: String },
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: { type: Date },
    },
    scanningCompletedAt: { type: Date },
    forwardedToSupportAt: { type: Date },
    forwardedToAdminAt: { type: Date },
    lastSavedAt: { type: Date },
    documentsFolder: {
      folderName: { type: String },
      folderPath: { type: String },
      cloudinaryFolder: { type: String },
      documentCount: { type: Number, default: 0 },
      temporaryEmployeeId: { type: String },
      employeeName: { type: String },
      organizedAt: { type: Date },
    },
  },
  { timestamps: true }
);

EmployeeSchema.pre("validate", function clampLegacyOnboardingProgress() {
  const max = ONBOARDING_TOTAL_STEPS;
  const step = Number(this.currentStep) || 1;
  this.currentStep = Math.min(Math.max(step, 1), max);
  if (Array.isArray(this.completedSteps)) {
    this.completedSteps = [
      ...new Set(
        this.completedSteps.filter((s) => Number(s) >= 1 && Number(s) <= max)
      ),
    ].sort((a, b) => a - b);
  }
});

EmployeeSchema.index({ email: 1, status: 1 });
EmployeeSchema.index({ status: 1, createdAt: -1 });
// Supports the dashboard live-update watermark queries
EmployeeSchema.index({ updatedAt: -1 });
EmployeeSchema.index({ status: 1, updatedAt: -1 });

if (process.env.NODE_ENV === "development" && mongoose.models.Employee) {
  delete mongoose.models.Employee;
}

export const Employee: Model<IEmployee> =
  mongoose.models.Employee ??
  mongoose.model<IEmployee>("Employee", EmployeeSchema);
