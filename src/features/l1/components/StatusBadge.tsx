import { EmployeeStatus } from "@/types/enums";
import { getRegistrationStatusLabel } from "@/features/application-status/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  [EmployeeStatus.DRAFT]:
    "bg-slate-100 text-slate-700 border-slate-200",
  [EmployeeStatus.SUBMITTED]:
    "bg-blue-50 text-blue-800 border-blue-200",
  [EmployeeStatus.L1_REVIEW]:
    "bg-blue-50 text-blue-800 border-blue-200",
  [EmployeeStatus.L1_RETURNED]:
    "bg-amber-50 text-amber-900 border-amber-200",
  [EmployeeStatus.L2_REVIEW]:
    "bg-sky-50 text-sky-900 border-sky-200",
  [EmployeeStatus.L2_RETURNED]:
    "bg-orange-50 text-orange-900 border-orange-200",
  [EmployeeStatus.APPROVED]:
    "bg-emerald-50 text-emerald-800 border-emerald-200",
  [EmployeeStatus.ID_GENERATED]:
    "bg-teal-50 text-teal-800 border-teal-200",
  [EmployeeStatus.SCANNING_COMPLETED]:
    "bg-cyan-50 text-cyan-900 border-cyan-200",
  [EmployeeStatus.ID_CARD_ISSUED]:
    "bg-[#0B1F3A]/5 text-[#0B1F3A] border-[#0B1F3A]/15",
  [EmployeeStatus.REJECTED]:
    "bg-red-50 text-red-800 border-red-200",
};

interface StatusBadgeProps {
  status: EmployeeStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-snug",
        STATUS_STYLES[status],
        className
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
      <span className="whitespace-normal">{getRegistrationStatusLabel(status)}</span>
    </span>
  );
}
