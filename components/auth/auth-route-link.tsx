"use client";

import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type AuthRouteLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
};

export function AuthRouteLink({
  children,
  className,
  href,
}: AuthRouteLinkProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const prefetchRoute = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    prefetchRoute();
  }, [prefetchRoute]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    setPending(true);
  };

  return (
    <Link
      aria-busy={pending}
      className={cn(className, pending && "text-[#36536a]")}
      href={href}
      onClick={handleClick}
      onFocus={prefetchRoute}
      onPointerEnter={prefetchRoute}
      prefetch
    >
      <span className="inline-flex items-center gap-1.5 align-baseline">
        <span>{children}</span>
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-3 shrink-0 rounded-full border border-current border-r-transparent opacity-0 transition-opacity",
            pending && "animate-spin opacity-100",
          )}
        />
      </span>
    </Link>
  );
}
