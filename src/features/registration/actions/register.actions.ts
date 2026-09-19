"use server";

import { connectDB } from "@/lib/db/connect";
import { Employee } from "@/lib/db/models/Employee";
import { EmployeeStatus, UserRole } from "@/types/enums";
import { generateApplicationRef } from "@/lib/utils";
import { z } from "zod";
import { applySchema } from "@/features/registration/schemas/apply.schema";
import {
  createEmployeeSession,
  setEmployeeSessionCookie,
} from "@/lib/auth/employee-session";
import { mapStep1DataToEmployeeFields } from "@/lib/services/onboarding.service";
import { STEP_SCHEMAS } from "@/features/onboarding/schemas/onboarding.schema";
import { auth } from "@/lib/auth/config";
import mongoose from "mongoose";
import { getSubmitterSnapshot } from "@/lib/services/submitter-snapshot";

export type RegisterResult =
  | { success: true; applicationRef: string }
  | { success: false; error: string };

function dbErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Database connection failed. Please try again in a moment.";
}

async function getSubmitterId(): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role === UserRole.SUBMITTER && session.user.id) {
    return session.user.id;
  }
  return undefined;
}


export async function registerEmployeeAction(
  formData: FormData
): Promise<RegisterResult> {
  const parsed = applySchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    await connectDB();
  } catch (error) {
    return { success: false, error: dbErrorMessage(error) };
  }

  const email = parsed.data.email.toLowerCase();

  const activeApplication = await Employee.findOne({
    email,
    status: {
      $nin: [EmployeeStatus.REJECTED, EmployeeStatus.ID_CARD_ISSUED],
    },
  }).lean();

  if (activeApplication) {
    return {
      success: false,
      error:
        "An active application already exists for this email. Please return to the registration page to continue.",
    };
  }

  const applicationRef = generateApplicationRef();
  const submitterId = await getSubmitterId();
  const submitterSnapshot = await getSubmitterSnapshot(submitterId);

  const employee = await Employee.create({
    applicationRef,
    email,
    phone: parsed.data.phone,
    personalDetails: { fullName: parsed.data.fullName },
    status: EmployeeStatus.DRAFT,
    currentStep: 1,
    completedSteps: [],
    ...(submitterId
      ? { submittedBy: new mongoose.Types.ObjectId(submitterId), ...submitterSnapshot }
      : {}),
  });

  const token = await createEmployeeSession({
    employeeId: employee._id.toString(),
    applicationRef: employee.applicationRef,
    email: employee.email,
  });

  await setEmployeeSessionCookie(token);

  return { success: true, applicationRef };
}

export async function registerAndSaveStep1Action(
  contact: { fullName: string; email: string; phone: string },
  stepData: Record<string, unknown>
): Promise<RegisterResult> {
  const parsed = applySchema
    .extend({
      email: z.string().email("Enter a valid email").or(z.literal("")),
    })
    .safeParse(contact);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid contact details",
    };
  }

  const stepResult = STEP_SCHEMAS[1].safeParse(stepData);
  if (!stepResult.success) {
    return {
      success: false,
      error: stepResult.error.errors[0]?.message ?? "Please complete all required fields",
    };
  }

  try {
    await connectDB();
  } catch (error) {
    return { success: false, error: dbErrorMessage(error) };
  }

  const email = parsed.data.email.toLowerCase();

  if (email) {
    const activeApplication = await Employee.findOne({
      email,
      status: {
        $nin: [EmployeeStatus.REJECTED, EmployeeStatus.ID_CARD_ISSUED],
      },
    }).lean();

    if (activeApplication) {
      return {
        success: false,
        error:
          "An active application already exists for this email. Please return to the registration page to continue.",
      };
    }
  }

  const applicationRef = generateApplicationRef();
  const stepFields = mapStep1DataToEmployeeFields(stepResult.data);
  const now = new Date();
  const submitterId = await getSubmitterId();
  const submitterSnapshot = await getSubmitterSnapshot(submitterId);

  const employee = await Employee.create({
    applicationRef,
    email,
    phone: parsed.data.phone,
    personalDetails: {
      ...stepFields.personalDetails,
      fullName:
        (stepFields.personalDetails.fullName as string | undefined) ??
        parsed.data.fullName,
    },
    address: stepFields.address,
    education: stepFields.education,
    additionalDetails: stepFields.additionalDetails,
    status: EmployeeStatus.DRAFT,
    currentStep: 2,
    completedSteps: [1],
    lastSavedAt: now,
    ...(submitterId
      ? { submittedBy: new mongoose.Types.ObjectId(submitterId), ...submitterSnapshot }
      : {}),
  });

  const token = await createEmployeeSession({
    employeeId: employee._id.toString(),
    applicationRef: employee.applicationRef,
    email: employee.email,
  });

  await setEmployeeSessionCookie(token);

  return { success: true, applicationRef };
}
