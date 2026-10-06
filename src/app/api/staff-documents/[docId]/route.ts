import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { UserRole } from "@/types/enums";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Roles that review uploaded documents as part of the approval workflow. */
const REVIEWER_ROLES: string[] = [
  UserRole.L1,
  UserRole.L2,
  UserRole.SCANNING,
  UserRole.ADMIN,
  UserRole.SUPPORT,
];

interface RouteParams {
  params: Promise<{ docId: string }>;
}

/**
 * Streams an uploaded employee document through the app so reviewers can preview
 * it inline or download it without depending on cross-origin Cloudinary access.
 *
 * `?mode=download` forces a file download; anything else renders inline.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.id || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;

  const doc = await prisma.employeeDocument.findFirst({
    where: { id: docId, isActive: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!REVIEWER_ROLES.includes(role)) {
    if (role !== UserRole.SUBMITTER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: doc.employeeId },
      select: { submittedBy: true },
    });

    if (!employee || employee.submittedBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

  const download = request.nextUrl.searchParams.get("mode") === "download";
  const safeName = doc.fileName.replace(/["\\\r\n]/g, "");
  const contentType =
    doc.mimeType ||
    upstream.headers.get("content-type") ||
    "application/octet-stream";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": download
        ? "private, no-store"
        : "private, max-age=300, immutable",
    },
  });
}
