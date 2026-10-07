import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { viewerForRole } from "@/features/attendance/constants";
import {
  AttendanceError,
  openAttendanceFile,
} from "@/lib/services/attendance.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function contentDisposition(fileName: string, download: boolean): string {
  const safeName = fileName.replace(/["\\\r\n]/g, "") || "attendance";
  return `${download ? "attachment" : "inline"}; filename="${safeName}"`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (!viewerForRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const download = request.nextUrl.searchParams.get("mode") === "download";
  const embed = request.nextUrl.searchParams.get("embed") === "1";

  try {
    const file = await openAttendanceFile(
      {
        id: session.user.id,
        name: session.user.name ?? "Staff",
        role,
      },
      id,
      download ? "download" : embed ? "embed" : "view",
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    );

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": contentDisposition(file.fileName, download),
        "Content-Length": String(file.buffer.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AttendanceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to open attendance." }, { status: 500 });
  }
}
