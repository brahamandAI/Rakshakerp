import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  href: string;
  unreadCount: number;
  className?: string;
}

export function NotificationBell({
  href,
  unreadCount,
  className,
}: NotificationBellProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-primary shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-sky-200 hover:bg-[#EFF6FF] hover:shadow-sm",
        className
      )}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

interface SidebarNotificationBadgeProps {
  unreadCount: number;
}

export function SidebarNotificationBadge({
  unreadCount,
}: SidebarNotificationBadgeProps) {
  if (unreadCount <= 0) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#FB7185] to-[#E11D48] px-1.5 text-[10px] font-bold text-white shadow-[0_4px_10px_-4px_rgba(225,29,72,0.7)] ring-2 ring-[#0E2340]">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
