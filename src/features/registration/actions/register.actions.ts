"use server";

import { prisma } from "@/lib/db/prisma";
import { newObjectIdString } from "@/lib/db/ids";
import { Prisma } from "@/generated/prisma/client";
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
import { getSubmitterSnapshot } from "@/lib/services/submitter-snapshot";
import {
  assertNoDuplicateApplicant,
  DuplicateApplicantError,
} from "@/lib/services/duplicate-applicant";

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

  const email = parsed.data.email.toLowerCase();

  try {
    const activeApplication = await prisma.employee.findFirst({
      where: {
        email,
        status: {
          notIn: [EmployeeStatus.REJECTED, EmployeeStatus.ID_CARD_ISSUED],
        },
      },
      select: { id: true },
    });

    if (activeApplication) {
      return {
        success: false,
        error:
          "An active application already exists for this email. Please return to the registration page to continue.",
      };
    }

    try {
      await assertNoDuplicateApplicant(null, {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
      });
    } catch (error) {
      if (error instanceof DuplicateApplicantError) {
        return { success: false, error: error.message };
      }
      throw error;
    }

    const applicationRef = generateApplicationRef();
    const submitterId = await getSubmitterId();
    const submitterSnapshot = await getSubmitterSnapshot(submitterId);
    const now = new Date();

    const employee = await prisma.employee.create({
      data: {
        id: newObjectIdString(),
        applicationRef,
        email,
        phone: parsed.data.phone,
        personalDetails: { fullName: parsed.data.fullName },
        status: EmployeeStatus.DRAFT,
        currentStep: 1,
        completedSteps: [],
        createdAt: now,
        updatedAt: now,
        ...(submitterId
          ? {
              submittedBy: submitterId,
              ...submitterSnapshot,
            }
          : {}),
      },
    });

    const token = await createEmployeeSession({
      employeeId: employee.id,
      applicationRef: employee.applicationRef,
      email: employee.email,
    });

    await setEmployeeSessionCookie(token);

    return { success: true, applicationRef };
  } catch (error) {
    return { success: false, error: dbErrorMessage(error) };
  }
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

  const email = parsed.data.email.toLowerCase();

  try {
    if (email) {
      const activeApplication = await prisma.employee.findFirst({
        where: {
          email,
          status: {
            notIn: [EmployeeStatus.REJECTED, EmployeeStatus.ID_CARD_ISSUED],
          },
        },
        select: { id: true },
      });

      if (activeApplication) {
        return {
          success: false,
          error:
            "An active application already exists for this email. Please return to the registration page to continue.",
        };
      }
    }

    const stepFields = mapStep1DataToEmployeeFields(stepResult.data);
    const personal = stepFields.personalDetails as {
      fullName?: string;
      aadhaarNumber?: string;
    };

    try {
      await assertNoDuplicateApplicant(null, {
        fullName: personal.fullName ?? parsed.data.fullName,
        phone: parsed.data.phone,
        aadhaarNumber: personal.aadhaarNumber,
      });
    } catch (error) {
      if (error instanceof DuplicateApplicantError) {
        return { success: false, error: error.message };
      }
      throw error;
    }

    const applicationRef = generateApplicationRef();
    const now = new Date();
    const submitterId = await getSubmitterId();
    const submitterSnapshot = await getSubmitterSnapshot(submitterId);

    const employee = await prisma.employee.create({
      data: {
        id: newObjectIdString(),
        applicationRef,
        email,
        phone: parsed.data.phone,
        personalDetails: {
          ...stepFields.personalDetails,
          fullName:
            (stepFields.personalDetails.fullName as string | undefined) ??
            parsed.data.fullName,
        } as Prisma.InputJsonValue,
        address: stepFields.address as Prisma.InputJsonValue,
        education: stepFields.education as Prisma.InputJsonValue,
        additionalDetails: stepFields.additionalDetails as Prisma.InputJsonValue,
        status: EmployeeStatus.DRAFT,
        currentStep: 2,
        completedSteps: [1],
        lastSavedAt: now,
        createdAt: now,
        updatedAt: now,
        ...(submitterId
          ? {
              submittedBy: submitterId,
              ...submitterSnapshot,
            }
          : {}),
      },
    });

    const token = await createEmployeeSession({
      employeeId: employee.id,
      applicationRef: employee.applicationRef,
      email: employee.email,
    });

    await setEmployeeSessionCookie(token);

    return { success: true, applicationRef };
  } catch (error) {
    return { success: false, error: dbErrorMessage(error) };
  }
}
