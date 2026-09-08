import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { POWERED_BY } from "@/features/marketing/site-content";

interface PoweredByRobustrixProps {
  className?: string;
  tone?: "light" | "dark";
}

export function PoweredByRobustrix({
  className,
  tone = "light",
}: PoweredByRobustrixProps) {
  const isDark = tone === "dark";

  return (
    <a
      href={POWERED_BY.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${POWERED_BY.prefix} ${POWERED_BY.name} (opens in a new tab)`}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full border px-2.5 py-1.5",
        "transition-all duration-200",
        isDark
          ? "border-white/15 bg-white/[0.06] hover:border-white/30 hover:bg-white/[0.12]"
          : "border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-sky-300 hover:shadow-sm",
        className
      )}
    >
      <span
        className={cn(
          "relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md",
          isDark ? "bg-white/10" : "bg-[#F8FAFC] ring-1 ring-[#E2E8F0]"
        )}
      >
        <Image
          src={isDark ? POWERED_BY.markLightSrc : POWERED_BY.markSrc}
          alt=""
          width={20}
          height={20}
          className="h-[18px] w-[18px] object-contain"
        />
      </span>
      <span className="flex items-baseline gap-1.5 pr-0.5">
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.16em]",
            isDark ? "text-white/55" : "text-[#94A3B8]"
          )}
        >
          {POWERED_BY.prefix}
        </span>
        <span
          className={cn(
            "text-[12px] font-semibold tracking-tight",
            isDark
              ? "text-white group-hover:text-white"
              : "text-[#0B1F3A] group-hover:text-[#0369A1]"
          )}
        >
          {POWERED_BY.name}
        </span>
      </span>
      <ArrowUpRight
        className={cn(
          "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100",
          isDark ? "text-white" : "text-[#64748B]"
        )}
        aria-hidden
      />
    </a>
  );
}
