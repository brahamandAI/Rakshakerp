import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { StaffRole, UserRole } from "@/types/enums";
import { listEmployeeDocumentFolders } from "@/lib/services/employee-documents-folder.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/employee-documents-folder
 * Lists employee folders under the main "Employee Documents" root.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as StaffRole;

  // L1 reviews documents on the application detail page only
  if (role === UserRole.L1) {
    return NextResponse.json(
      { error: "L1 accesses documents during application review only" },
      { status: 403 }
    );
  }

  const data = await listEmployeeDocumentFolders({
    role,
    userId: session.user.id,
  });

  const canDownloadFolder =
    role === UserRole.ADMIN ||
    role === UserRole.SUPPORT ||
    role === UserRole.L2 ||
    role === UserRole.SCANNING;

  return NextResponse.json({
    ...data,
    canDownloadFolder,
  });
}
