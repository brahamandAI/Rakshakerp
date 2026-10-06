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
    "bg-[#0B1F3A] text-white shadow-[0_10px_24px_-14px_rgba(11,31,58,0.7)] hover:bg-[#12325C] hover:shadow-md",
  accent:
    "bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-[#0B1F3A] shadow-[0_10px_24px_-14px_rgba(212,175,55,0.75)] hover:from-[#F8D56A] hover:to-[#E4C65A] hover:shadow-md",
  sky:
    "bg-gradient-to-r from-[#0EA5E9] to-[#1E90FF] text-white shadow-[0_10px_24px_-12px_rgba(30,144,255,0.7)] hover:from-[#38BDF8] hover:to-[#0EA5E9] hover:shadow-md",
  teal:
    "bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-[0_10px_24px_-14px_rgba(15,118,110,0.65)] hover:from-[#2DD4BF] hover:to-[#0D9488] hover:shadow-md",
  success:
    "bg-[#16A34A] text-white shadow-[0_8px_20px_-12px_rgba(22,163,74,0.55)] hover:bg-[#15803D] hover:shadow-md",
  warning:
    "bg-[#F59E0B] text-white shadow-sm hover:bg-[#D97706] hover:shadow-md",
  secondary:
    "bg-white text-[#0B1F3A] border border-sky-100 shadow-sm hover:border-sky-200 hover:bg-[#F0F9FF] hover:shadow",
  destructive:
    "bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C] hover:shadow-md",
  ghost: "bg-transparent text-[#0B1F3A] hover:bg-sky-50",
  outline:
    "border border-sky-200 text-[#0284C7] bg-white hover:border-sky-300 hover:bg-sky-50",
  back: "border border-sky-100 bg-white text-[#0284C7] shadow-sm hover:border-sky-200 hover:bg-[#F0F9FF]",
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
