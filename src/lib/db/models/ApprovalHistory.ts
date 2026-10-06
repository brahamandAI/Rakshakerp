import mongoose, { Schema, Document, Model } from "mongoose";

export type ApprovalAction =
  | "SUBMIT"
  | "L1_APPROVE"
  | "L1_REJECT"
  | "L1_RETURN"
  | "L2_APPROVE"
  | "L2_REJECT"
  | "L2_RETURN"
  | "L2_RETURN_TO_L1"
  | "L2_FORWARD"
  | "L2_FORWARD_ADMIN"
  | "RESUBMIT"
  | "GENERATE_ID"
  | "SCANNING_COMPLETE";

export interface IApprovalHistory extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  fromStatus: string;
  toStatus: string;
  action: ApprovalAction;
  performedBy: mongoose.Types.ObjectId;
  performedByRole: string;
  comment?: string;
  createdAt: Date;
}

const ApprovalHistorySchema = new Schema<IApprovalHistory>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    action: { type: String, required: true },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    performedByRole: { type: String, required: true },
    comment: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ApprovalHistorySchema.index({ employeeId: 1, createdAt: -1 });

export const ApprovalHistory: Model<IApprovalHistory> =
  mongoose.models.ApprovalHistory ??
  mongoose.model<IApprovalHistory>("ApprovalHistory", ApprovalHistorySchema);
