import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  Mail,
  Phone,
  FileText,
  IdCard,
  Calendar,
  Briefcase,
  CheckCircle2,
  Clock,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ApplicationStatusData,
  DISPLAY_STATUS_CONFIG,
  TimelineStep,
} from "@/features/application-status/constants";

interface ApplicationInfoSidebarProps {
  data: ApplicationStatusData;
}

export function ApplicationInfoSidebar({ data }: ApplicationInfoSidebarProps) {
  const config = DISPLAY_STATUS_CONFIG[data.displayStatus];
  const completedCount = data.timeline.filter((s) => s.state === "completed").length;

  return (
    <aside className="flex h-full flex-col bg-primary text-white">
      <div className="border-b border-white/10 bg-black px-3 py-3">
        <BrandLogo href="/application" variant="sidebar" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Applicant
          </p>
          <p className="mt-2 font-heading text-lg font-bold">{data.fullName}</p>
          {data.postAppliedFor && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
              <Briefcase className="h-3.5 w-3.5 text-accent" />
              {data.postAppliedFor}
            </p>
          )}
          <div className="mt-4">
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                config.badgeClass
              )}
            >
              {data.displayLabel}
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <SidebarRow icon={FileText} label="Application Ref" value={data.applicationRef} mono />
          <SidebarRow icon={Mail} label="Email" value={data.email} />
          <SidebarRow icon={Phone} label="Mobile" value={data.phone} />
          {data.employeeId && (
            <SidebarRow icon={IdCard} label="Employee ID" value={data.employeeId} mono accent />
          )}
          {data.submittedAt && (
            <SidebarRow
              icon={Calendar}
              label="Submitted"
              value={new Date(data.submittedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              Progress
            </p>
            <span className="text-xs font-bold text-accent">
              {completedCount}/{data.timeline.length}
            </span>
          </div>
          <ol className="space-y-2">
            {data.timeline.map((step) => (
              <MiniTimelineItem key={step.id} step={step} />
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/10 p-4 text-xs leading-relaxed text-white/70">
          <p className="font-semibold text-accent">Need help?</p>
          <p className="mt-1">
            Contact HR for application queries. Keep your reference number handy when reaching out.
          </p>
        </div>
      </div>
    </aside>
  );
}

function SidebarRow({
  icon: Icon,
  label,
  value,
  mono,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[10px] text-white/50">{label}</p>
        <p
          className={cn(
            "text-xs font-medium text-white break-all",
            mono && "font-mono",
            accent && "text-accent"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function MiniTimelineItem({ step }: { step: TimelineStep }) {
  return (
    <li className="flex items-center gap-2.5 text-xs">
      {step.state === "completed" && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
      )}
      {step.state === "current" && (
        <Clock className="h-4 w-4 shrink-0 text-accent" />
      )}
      {step.state === "error" && (
        <Circle className="h-4 w-4 shrink-0 text-red-400" />
      )}
      {step.state === "pending" && (
        <Circle className="h-4 w-4 shrink-0 text-white/25" />
      )}
      <span
        className={cn(
          step.state === "pending" ? "text-white/40" : "text-white/85"
        )}
      >
        {step.title}
      </span>
    </li>
  );
}
