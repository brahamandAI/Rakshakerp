import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  RAKSHAK_LOGO_ALT,
  RAKSHAK_LOGO_SIDEBAR_SRC,
  RAKSHAK_LOGO_SRC,
} from "@/lib/brand";

type BrandVariant = "sidebar" | "light" | "dark";

interface RakshakBrandMarkProps {
  variant?: BrandVariant;
  className?: string;
  /** @deprecated Logo image includes full wordmark */
  showTagline?: boolean;
  priority?: boolean;
}

const variantStyles: Record<
  BrandVariant,
  { wrapper: string; image: string; src: string; width: number; height: number }
> = {
  dark: {
    wrapper: "",
    image: "max-h-11 sm:max-h-[3.25rem] lg:max-h-14",
    src: RAKSHAK_LOGO_SRC,
    width: 1024,
    height: 379,
  },
  sidebar: {
    wrapper: "",
    image: "h-auto max-h-[68px] w-auto max-w-full",
    src: RAKSHAK_LOGO_SIDEBAR_SRC,
    width: 940,
    height: 265,
  },
  light: {
    wrapper: "px-0.5 py-1",
    image: "max-h-12 sm:max-h-14",
    src: RAKSHAK_LOGO_SIDEBAR_SRC,
    width: 940,
    height: 265,
  },
};

export function RakshakBrandMark({
  variant = "dark",
  className,
  priority = false,
}: RakshakBrandMarkProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative inline-flex max-w-full items-center",
        styles.wrapper,
        className
      )}
    >
      {variant === "sidebar" ? (
        // Native img avoids extra scaling passes that soften the lockup on dark chrome.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={styles.src}
          alt={RAKSHAK_LOGO_ALT}
          width={styles.width}
          height={styles.height}
          className={cn("object-contain object-left", styles.image)}
        />
      ) : (
        <Image
          src={styles.src}
          alt={RAKSHAK_LOGO_ALT}
          width={styles.width}
          height={styles.height}
          quality={100}
          unoptimized
          priority={priority}
          sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 360px"
          className={cn(
            "h-auto w-auto max-w-full object-contain object-left",
            styles.image
          )}
        />
      )}
    </div>
  );
}
