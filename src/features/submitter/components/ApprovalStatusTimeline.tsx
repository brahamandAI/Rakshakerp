"use client";

import { cn } from "@/lib/utils";

export interface ApprovalTimelineItem {
  action: string;
  fromStatus: string;
  toStatus: string;
  comment?: string;
  createdAt: string | Date;
  performedBy?: { name?: string };
  performedByRole?: string;
}

const ACTION_META: Record<string, { label: string; tone: string }> = {
  SUBMIT: { label: "Submitted", tone: "text-sky-700" },
  RESUBMIT: { label: "Resubmitted", tone: "text-sky-700" },
  L1_APPROVE: { label: "L1 approved", tone: "text-emerald-700" },
  L1_RETURN: { label: "L1 reversed", tone: "text-amber-700" },
  L1_REJECT: { label: "L1 reversed", tone: "text-amber-700" },
  L2_APPROVE: { label: "L2 approved", tone: "text-emerald-700" },
  L2_RETURN: { label: "L2 reversed", tone: "text-amber-700" },
  L2_RETURN_TO_L1: { label: "Sent back to L1", tone: "text-amber-700" },
  L2_REJECT: { label: "L2 reversed", tone: "text-amber-700" },
  L2_FORWARD: { label: "Forwarded", tone: "text-violet-700" },
  L2_FORWARD_ADMIN: { label: "Sent to Admin", tone: "text-violet-700" },
  GENERATE_ID: { label: "Temp ID generated", tone: "text-emerald-700" },
};

function formatWhen(value: string | Date) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalStatusTimeline({
  history,
  currentStatus,
}: {
  history: ApprovalTimelineItem[];
  currentStatus?: string;
}) {
  const items = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (items.length === 0) return null;

  return (
    <ol className="flex flex-col gap-1">
      {items.map((item, index) => {
        const meta = ACTION_META[item.action] ?? {
          label: item.action.replace(/_/g, " "),
          tone: "text-[#475569]",
        };
        const isLatest = index === items.length - 1;
        return (
          <li
            key={`${item.action}-${index}`}
            className={cn(
              "flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] leading-snug",
              isLatest ? meta.tone : "text-[#64748B]"
            )}
          >
            <span className={cn("font-semibold", isLatest && meta.tone)}>
              {meta.label}
            </span>
            <span className="text-[#94A3B8]">
              {item.performedBy?.name ?? "System"}
              {item.performedByRole ? ` · ${item.performedByRole}` : ""}
            </span>
            <time className="text-[#94A3B8]">{formatWhen(item.createdAt)}</time>
            {item.comment && (
              <span className="basis-full text-[#64748B]">Note: {item.comment}</span>
            )}
          </li>
        );
      })}
      {currentStatus && (
        <li className="sr-only">Current status {currentStatus.replace(/_/g, " ")}</li>
      )}
    </ol>
  );
}
