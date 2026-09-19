"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "ghost"
    | "outline"
    | "accent"
    | "sky"
    | "teal"
    | "success"
    | "warning"
    | "back";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-[#0B1F3A] text-white shadow-[0_8px_20px_-12px_rgba(11,31,58,0.65)] hover:bg-[#12325C] hover:shadow-md",
  accent:
    "bg-[#D4AF37] text-[#0B1F3A] shadow-[0_8px_20px_-12px_rgba(212,175,55,0.7)] hover:bg-[#E4C65A] hover:shadow-md",
  sky:
    "bg-[#0284C7] text-white shadow-sm hover:bg-[#0369A1] hover:shadow-md",
  teal:
    "bg-[#0F766E] text-white shadow-sm hover:bg-[#115E59] hover:shadow-md",
  success:
    "bg-[#15803D] text-white shadow-sm hover:bg-[#166534] hover:shadow-md",
  warning:
    "bg-[#D97706] text-white shadow-sm hover:bg-[#B45309] hover:shadow-md",
  secondary:
    "bg-white text-primary border border-[#E2E8F0] shadow-sm hover:border-sky-200 hover:bg-[#F8FAFC] hover:shadow",
  destructive:
    "bg-[#B91C1C] text-white shadow-sm hover:bg-[#991B1B] hover:shadow-md",
  ghost: "bg-transparent text-primary hover:bg-[#EFF6FF]",
  outline:
    "border border-[#0B1F3A]/20 text-primary bg-white hover:border-[#0B1F3A]/40 hover:bg-[#F8FAFC]",
  back: "border border-[#E2E8F0] bg-white text-[#1D4ED8] shadow-sm hover:border-sky-200 hover:bg-[#EFF6FF]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3.5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold leading-tight transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
