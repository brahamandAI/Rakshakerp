import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { UserRole } from "@/types/enums";
import {
  assertExportRole,
  exportRegistrationsExcel,
  previewRegistrationsExport,
  ExportScope,
} from "@/lib/services/export-registrations.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = (request.nextUrl.searchParams.get("scope") ?? "") as ExportScope;
  if (!["l1", "l2", "admin", "scanning"].includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  try {
    assertExportRole(session.user.role, scope);
    const effectiveScope: ExportScope =
      session.user.role === UserRole.ADMIN && scope === "admin"
        ? "admin"
        : scope;

    const employeeId = request.nextUrl.searchParams.get("id") ?? undefined;
    const idsParam = request.nextUrl.searchParams.get("ids");
    const employeeIds = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const dateFrom = request.nextUrl.searchParams.get("dateFrom") ?? undefined;
    const dateTo = request.nextUrl.searchParams.get("dateTo") ?? undefined;

    const options = { employeeId, employeeIds, dateFrom, dateTo };

    if (request.nextUrl.searchParams.get("preview") === "1") {
      const preview = await previewRegistrationsExport(
        effectiveScope,
        session.user.id,
        options
      );
      return NextResponse.json(preview);
    }

    const { filename, xml } = await exportRegistrationsExcel(
      effectiveScope,
      session.user.id,
      options
    );

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
