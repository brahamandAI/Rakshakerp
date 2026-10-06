import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  createEmployeeSession,
  getEmployeeSession,
  setEmployeeSessionCookie,
} from "@/lib/auth/employee-session";
import { prisma } from "@/lib/db/prisma";
import {
  uploadEmployeeDocument,
  OnboardingError,
} from "@/lib/services/onboarding.service";
import { DocumentType } from "@/features/onboarding/constants";
import { EmployeeStatus, UserRole } from "@/types/enums";

export const runtime = "nodejs";
export const maxDuration = 60;

const EDITABLE_STATUSES = [
  EmployeeStatus.DRAFT,
  EmployeeStatus.SUBMITTED,
  EmployeeStatus.L1_REVIEW,
  EmployeeStatus.L1_RETURNED,
  EmployeeStatus.L2_RETURNED,
];

async function resolveUploadEmployeeId(
  sessionEmployeeId?: string
): Promise<string | null> {
  if (sessionEmployeeId) {
    const current = await prisma.employee.findUnique({
      where: { id: sessionEmployeeId },
      select: { status: true },
    });
    if (
      current &&
      EDITABLE_STATUSES.includes(current.status as EmployeeStatus)
    ) {
      return sessionEmployeeId;
    }
  }

  const staffSession = await auth();
  if (staffSession?.user?.role === UserRole.SUBMITTER && staffSession.user.id) {
    const draft = await prisma.employee.findFirst({
      where: {
        submittedBy: staffSession.user.id,
        status: EmployeeStatus.DRAFT,
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, applicationRef: true, email: true },
    });

    if (draft) {
      const token = await createEmployeeSession({
        employeeId: draft.id,
        applicationRef: draft.applicationRef,
        email: draft.email,
      });
      await setEmployeeSessionCookie(token);
      return draft.id;
    }
  }

  return sessionEmployeeId ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    const employeeId = await resolveUploadEmployeeId(session?.employeeId);

    if (!employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = formData.get("documentType");

    if (!(file instanceof File) || typeof documentType !== "string" || !documentType) {
      return NextResponse.json(
        { error: "Missing file or document type" },
        { status: 400 }
      );
    }

    if (!Object.values(DocumentType).includes(documentType as DocumentType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const record = await uploadEmployeeDocument(
      employeeId,
      documentType as DocumentType,
      file
    );

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    if (error instanceof OnboardingError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("[documents/upload]", error);

    const message = error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
