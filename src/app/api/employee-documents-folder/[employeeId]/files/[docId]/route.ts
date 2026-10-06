import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { StaffRole } from "@/types/enums";
import { prisma } from "@/lib/db/prisma";
import {
  canAccessDocumentsFolder,
  getEmployeeDocumentsFolder,
} from "@/lib/services/employee-documents-folder.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ employeeId: string; docId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId, docId } = await params;
  const data = await getEmployeeDocumentsFolder(employeeId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = canAccessDocumentsFolder({
    role: session.user.role as StaffRole,
    userId: session.user.id,
    employee: {
      status: data.employeeStatus,
      submittedBy: data.submittedBy,
      temporaryEmployeeId: data.temporaryEmployeeId,
      forwardedToAdminAt: data.forwardedToAdminAt,
      forwardedToSupportAt: data.forwardedToSupportAt,
      l2Decision: data.l2Decision,
      documentsFolder: data.folder,
    },
  });

  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason ?? "Forbidden" },
      { status: 403 }
    );
  }

  const doc = await prisma.employeeDocument.findFirst({
    where: {
      id: docId,
      employeeId,
      isActive: true,
    },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(doc.url, {
      cache: "force-cache",
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch document" },
      { status: 504 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Unable to fetch document" },
      { status: 502 }
    );
  }

  const disposition = `attachment; filename="${doc.fileName.replace(/"/g, "")}"`;

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        doc.mimeType ||
        upstream.headers.get("content-type") ||
        "application/octet-stream",
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=300, immutable",
    },
  });
}
