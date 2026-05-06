import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({
  alt = "",
  className,
  imageClassName,
  priority = false,
  size = 44,
}: {
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: number;
}) {
  return (
    <span
      className={cn("shrink-0", className)}
      style={{
        alignItems: "center",
        display: "inline-flex",
        flexShrink: 0,
        height: size,
        justifyContent: "center",
        overflow: "hidden",
        width: size,
      }}
    >
      <Image
        alt={alt}
        className={imageClassName}
        height={size}
        preload={priority}
        quality={90}
        sizes={`${size}px`}
        src="/images/pt5-logo.png"
        style={{
          display: "block",
          height: "100%",
          objectFit: "contain",
          width: "100%",
        }}
        width={size}
      />
    </span>
  );
}
