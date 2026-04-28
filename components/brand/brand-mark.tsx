import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({
  alt = "",
  className,
  imageClassName,
  priority = false,
}: {
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-sm",
        className,
      )}
    >
      <Image
        alt={alt}
        className={cn("size-[82%] object-contain", imageClassName)}
        height={300}
        priority={priority}
        src="/images/pt5-logo.png"
        width={300}
      />
    </span>
  );
}
