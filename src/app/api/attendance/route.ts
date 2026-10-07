import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { UserRole } from "@/types/enums";
import {
  AttendanceError,
  submitAttendance,
} from "@/lib/services/attendance.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SUBMITTER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const payrollManagerId = String(formData.get("payrollManagerId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Select an attendance file." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const created = await submitAttendance({
      actor: {
        id: session.user.id,
        name: session.user.name ?? "Registration Submitter",
        role: session.user.role,
      },
      payrollManagerId,
      fileName: file.name,
      mimeType: file.type,
      buffer,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    revalidatePath("/dashboard/submitter/attendance");
    revalidatePath("/dashboard/payroll-manager");
    revalidatePath("/dashboard/payroll-manager/attendance");

    return NextResponse.json({ success: true, ...created });
  } catch (error) {
    if (error instanceof AttendanceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to upload attendance." }, { status: 500 });
  }
}
