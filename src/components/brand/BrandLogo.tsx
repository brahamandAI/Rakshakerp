import Link from "next/link";
import { cn } from "@/lib/utils";
import { RakshakBrandMark } from "@/components/brand/RakshakBrandMark";

type BrandVariant = "sidebar" | "light" | "dark";

interface BrandLogoProps {
  href?: string | null;
  className?: string;
  variant?: BrandVariant;
  showTagline?: boolean;
  priority?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function BrandLogo({
  href = "/",
  className,
  variant = "light",
  showTagline,
  priority = false,
  onClick,
}: BrandLogoProps) {
  const mark = (
    <RakshakBrandMark
      variant={variant}
      showTagline={showTagline}
      priority={priority}
    />
  );

  if (href == null) {
    return <div className={className}>{mark}</div>;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("inline-flex max-w-[320px] shrink-0 items-center lg:max-w-[360px]", className)}
    >
      {mark}
    </Link>
  );
}
