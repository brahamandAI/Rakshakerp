"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { STAFF_ROLE_OPTIONS } from "@/features/auth/constants";
import { UserRole } from "@/types/enums";
import { cn } from "@/lib/utils";

interface StaffSignInFormFieldsProps {
  idPrefix?: string;
  role: string;
  onRoleChange: (role: string) => void;
  isLoading?: boolean;
  showForgotPassword?: boolean;
  className?: string;
  emailInputRef?: React.RefObject<HTMLInputElement | null>;
}

function emailPlaceholder(role: string): string {
  if (role === UserRole.L1) return "l1@rakshaksecuritas.com";
  if (role === UserRole.L2) return "l2@rakshaksecuritas.com";
  if (role === UserRole.SUPPORT) return "support@rakshaksecuritas.com";
  if (role === UserRole.ADMIN) return "admin@rakshaksecuritas.com";
  return "you@rakshaksecuritas.com";
}

const fieldControlClass =
  "h-12 rounded-xl border-[#D8E0EA] bg-[#F8FAFC] text-[0.9375rem] text-[#0F172A] shadow-none placeholder:text-[#94A3B8] transition-all duration-200 hover:border-[#C5D0DE] hover:bg-white focus-visible:border-sky-400 focus-visible:bg-white focus-visible:ring-sky-400/30";

export function StaffSignInFormFields({
  idPrefix = "",
  role,
  onRoleChange,
  isLoading = false,
  showForgotPassword = true,
  className,
  emailInputRef,
}: StaffSignInFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const roleId = `${idPrefix}staff-role`;
  const emailId = `${idPrefix}staff-email`;
  const passwordId = `${idPrefix}staff-password`;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-2">
        <Label
          htmlFor={roleId}
          required
          className="text-[13px] font-semibold tracking-wide text-[#1E293B]"
        >
          Role
        </Label>
        <Select
          id={roleId}
          name="role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          required
          disabled={isLoading}
          placeholder="Select your role"
          className={fieldControlClass}
          options={STAFF_ROLE_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor={emailId}
          required
          className="text-[13px] font-semibold tracking-wide text-[#1E293B]"
        >
          Email
        </Label>
        <Input
          id={emailId}
          ref={emailInputRef}
          name="email"
          type="email"
          placeholder={emailPlaceholder(role)}
          autoComplete="username"
          required
          disabled={isLoading}
          className={fieldControlClass}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor={passwordId}
            required
            className="text-[13px] font-semibold tracking-wide text-[#1E293B]"
          >
            Password
          </Label>
          {showForgotPassword && (
            <Link
              href="/staff/forgot-password"
              className="text-xs font-semibold text-[#0284C7] transition-all duration-200 hover:text-[#0369A1] hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            disabled={isLoading}
            className={cn(fieldControlClass, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#64748B] transition-all duration-200 hover:bg-[#E2E8F0]/70 hover:text-[#0B1F3A]"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
