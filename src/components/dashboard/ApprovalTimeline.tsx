import { EmployeeStatus } from "@/types/enums";
import { cn } from "@/lib/utils";

interface ApprovalTimelineProps {
  status: EmployeeStatus;
  className?: string;
}

type Stage = {
  key: string;
  label: string;
  isDone: (s: EmployeeStatus) => boolean;
  isCurrent: (s: EmployeeStatus) => boolean;
};

const STAGES: Stage[] = [
  {
    key: "submitted",
    label: "Submitted",
    isDone: (s) => s !== EmployeeStatus.DRAFT,
    isCurrent: (s) => s === EmployeeStatus.DRAFT,
  },
  {
    key: "l1",
    label: "L1",
    isDone: (s) =>
      [
        EmployeeStatus.L2_REVIEW,
        EmployeeStatus.L2_RETURNED,
        EmployeeStatus.APPROVED,
        EmployeeStatus.ID_GENERATED,
        EmployeeStatus.ID_CARD_ISSUED,
      ].includes(s),
    isCurrent: (s) =>
      [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW, EmployeeStatus.L1_RETURNED].includes(
        s
      ),
  },
  {
    key: "l2",
    label: "L2",
    isDone: (s) =>
      [
        EmployeeStatus.APPROVED,
        EmployeeStatus.ID_GENERATED,
        EmployeeStatus.ID_CARD_ISSUED,
      ].includes(s),
    isCurrent: (s) =>
      [EmployeeStatus.L2_REVIEW, EmployeeStatus.L2_RETURNED].includes(s),
  },
  {
    key: "tempId",
    label: "Temp ID",
    isDone: (s) =>
      [EmployeeStatus.ID_GENERATED, EmployeeStatus.ID_CARD_ISSUED].includes(s),
    isCurrent: (s) => s === EmployeeStatus.APPROVED,
  },
  {
    key: "done",
    label: "Complete",
    isDone: (s) => s === EmployeeStatus.ID_CARD_ISSUED,
    isCurrent: (s) => s === EmployeeStatus.ID_GENERATED,
  },
];

function stageState(
  status: EmployeeStatus,
  stage: Stage
): "done" | "current" | "upcoming" {
  if (stage.isCurrent(status)) return "current";
  if (stage.isDone(status)) return "done";
  return "upcoming";
}

export function ApprovalTimeline({ status, className }: ApprovalTimelineProps) {
  if (status === EmployeeStatus.REJECTED) {
    return (
      <p className={cn("text-[11px] font-medium text-red-600", className)}>
        Reversed for correction
      </p>
    );
  }

  return (
    <ol className={cn("flex flex-wrap items-center gap-1", className)}>
      {STAGES.map((stage, idx) => {
        const state = stageState(status, stage);
        return (
          <li key={stage.key} className="flex items-center gap-1">
            {idx > 0 && <span className="text-[10px] text-[#CBD5E1]" aria-hidden>›</span>}
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
                state === "done" && "bg-emerald-50 text-emerald-700",
                state === "current" && "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
                state === "upcoming" && "bg-[#F1F5F9] text-[#94A3B8]"
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
