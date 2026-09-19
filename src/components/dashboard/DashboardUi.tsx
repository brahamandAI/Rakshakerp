import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StaffRole } from "@/types/enums";

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-primary sm:text-[1.75rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#64748B]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

interface WelcomeCardProps {
  userName: string;
  role: StaffRole;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** @deprecated Prefer DashboardPageHeader for cleaner pages */
export function WelcomeCard({
  userName,
  title,
  description,
  actions,
  className,
}: WelcomeCardProps) {
  return (
    <DashboardPageHeader
      title={title ?? `Hello, ${userName.split(" ")[0]}`}
      description={description}
      actions={actions}
      className={className}
    />
  );
}

interface DashboardStatCardProps {
  title: string;
  value: number | string;
  href?: string;
  linkLabel?: string;
  tone?: "default" | "blue" | "green" | "amber" | "red" | "slate";
  hint?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  style?: React.CSSProperties;
}

const TONE_STYLES: Record<
  NonNullable<DashboardStatCardProps["tone"]>,
  { value: string; bar: string; iconBg: string; iconText: string }
> = {
  default: {
    value: "text-primary",
    bar: "from-[#0B1F3A] to-[#1D4ED8]",
    iconBg: "bg-[#EFF6FF]",
    iconText: "text-[#1D4ED8]",
  },
  blue: {
    value: "text-[#1D4ED8]",
    bar: "from-[#1D4ED8] to-[#38BDF8]",
    iconBg: "bg-[#EFF6FF]",
    iconText: "text-[#1D4ED8]",
  },
  green: {
    value: "text-[#15803D]",
    bar: "from-[#15803D] to-[#4ADE80]",
    iconBg: "bg-[#F0FDF4]",
    iconText: "text-[#15803D]",
  },
  amber: {
    value: "text-[#B45309]",
    bar: "from-[#B45309] to-[#FBBF24]",
    iconBg: "bg-[#FFFBEB]",
    iconText: "text-[#B45309]",
  },
  red: {
    value: "text-[#B91C1C]",
    bar: "from-[#B91C1C] to-[#F87171]",
    iconBg: "bg-[#FEF2F2]",
    iconText: "text-[#B91C1C]",
  },
  slate: {
    value: "text-[#334155]",
    bar: "from-[#334155] to-[#94A3B8]",
    iconBg: "bg-[#F8FAFC]",
    iconText: "text-[#475569]",
  },
};

export function DashboardStatCard({
  title,
  value,
  href,
  linkLabel = "View",
  tone = "default",
  hint,
  description,
  icon: Icon,
  className,
  style,
}: DashboardStatCardProps) {
  const tones = TONE_STYLES[tone];
  const content = (
    <>
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r opacity-90",
          tones.bar
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] text-[#64748B]">
          {title}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              tones.iconBg,
              tones.iconText
            )}
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className={cn("mt-3 font-heading text-3xl font-bold tracking-tight", tones.value)}>
        {value}
      </p>
      {(hint || description) && (
        <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">{description ?? hint}</p>
      )}
      {href && (
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1D4ED8] transition group-hover:gap-2">
          {linkLabel}
          <span aria-hidden>→</span>
        </span>
      )}
    </>
  );

  const cardClass = cn(
    "group relative block h-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200",
    href &&
      "cursor-pointer hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_16px_36px_-20px_rgba(14,165,233,0.45)]",
    !href && "hover:border-sky-200",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cardClass} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClass} style={style}>
      {content}
    </div>
  );
}

export function DashboardSection({
  title,
  action,
  children,
  className,
  icon: Icon,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1D4ED8]">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <h3 className="font-heading text-lg font-semibold text-primary">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
