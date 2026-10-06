"use client";

import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StaffSignInButtonProps {
  variant?: "default" | "outline" | "sky";
  size?: "sm" | "default";
  className?: string;
  defaultRole?: string;
  onOpen?: () => void;
}

export function StaffSignInButton({
  variant = "outline",
  size = "sm",
  className,
  defaultRole = "",
  onOpen,
}: StaffSignInButtonProps) {
  const router = useRouter();

  function handleOpen() {
    const url = defaultRole
      ? `/staff/login?role=${encodeURIComponent(defaultRole)}`
      : "/staff/login";
    router.push(url);
    onOpen?.();
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={handleOpen}
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </Button>
  );
}
