import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/auth/employee-session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const doc = await prisma.employeeDocument.findFirst({
      where: {
        id,
        employeeId: session.employeeId,
        isActive: true,
      },
      select: { url: true },
    });

    if (!doc?.url) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.redirect(doc.url);
  } catch {
    return NextResponse.json({ error: "Failed to retrieve document" }, { status: 500 });
  }
}
