import { prisma } from "@/lib/db/prisma";
import { CheckCircle, XCircle, BadgeCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { asRecord } from "@/lib/services/approval-queue";

export const metadata = { title: "Verify Employee — Rakshak Securitas" };

interface PageProps {
  params: Promise<{ employeeId: string }>;
}

export default async function VerifyEmployeePage({ params }: PageProps) {
  const { employeeId: employeeIdCode } = await params;

  const employee = await prisma.employee.findFirst({
    where: { employeeId: employeeIdCode },
    select: {
      id: true,
      employeeId: true,
      applicationRef: true,
      status: true,
      personalDetails: true,
    },
  });

  const idCard = employee
    ? await prisma.idCard.findFirst({
        where: { employeeId: employee.id, status: "ACTIVE" },
        select: { generatedAt: true },
      })
    : null;

  const personal = asRecord(employee?.personalDetails) as {
    fullName?: string;
    postAppliedFor?: string;
  } | null;
  const isValid =
    !!employee && employee.status === "ID_CARD_ISSUED" && !!idCard;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="mb-6">
          <BrandLogo href="/" variant="dark" className="max-w-[260px]" />
          <h1 className="mt-4 font-heading text-lg font-bold text-primary">
            Employee Verification
          </h1>
        </div>

        {isValid ? (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-800">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Valid employee ID card</span>
            </div>
            <dl className="space-y-3">
              <VerifyField label="Employee ID" value={employee!.employeeId!} />
              <VerifyField label="Name" value={personal?.fullName ?? "—"} />
              <VerifyField label="Post" value={personal?.postAppliedFor ?? "—"} />
              <VerifyField
                label="Application Ref"
                value={employee!.applicationRef}
              />
              {idCard?.generatedAt && (
                <VerifyField
                  label="ID Card Issued"
                  value={new Date(idCard.generatedAt).toLocaleDateString("en-IN")}
                />
              )}
            </dl>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-800">
              <XCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">
                {employee
                  ? "ID card not yet issued or inactive"
                  : "Employee ID not found"}
              </span>
            </div>
            <p className="text-sm text-[#64748B]">
              Code: <span className="font-mono">{employeeIdCode}</span>
            </p>
          </>
        )}

        <div className="mt-6 flex items-center gap-2 text-xs text-[#64748B]">
          <BadgeCheck className="h-4 w-4" />
          <span>Official verification portal</span>
        </div>
      </div>
    </div>
  );
}

function VerifyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-primary">{value}</dd>
    </div>
  );
}
