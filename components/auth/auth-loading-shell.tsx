import { cn } from "@/lib/utils";

type AuthLoadingShellProps = {
  variant: "login" | "register" | "recovery";
};

export function AuthLoadingShell({ variant }: AuthLoadingShellProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "space-y-6",
        variant === "login" && "min-h-[360px]",
        variant === "register" && "min-h-[560px]",
        variant === "recovery" && "min-h-[260px]",
      )}
      role="status"
    >
      <span className="sr-only">loading</span>

      {variant === "register" ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <SkeletonField />
            <SkeletonField />
          </div>
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
          <div className="flex items-start gap-3 pt-1">
            <div className="mt-0.5 size-5 rounded-md bg-[#d7e2ea]/80" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-[88%] rounded-full bg-[#d7e2ea]/80" />
              <div className="h-3 w-[54%] rounded-full bg-[#d7e2ea]/60" />
            </div>
          </div>
        </>
      ) : (
        <>
          <SkeletonField />
          <SkeletonField />
          {variant === "login" ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-md bg-[#d7e2ea]/80" />
                <div className="h-3 w-28 rounded-full bg-[#d7e2ea]/60" />
              </div>
              <div className="h-3 w-20 rounded-full bg-[#d7e2ea]/60" />
            </div>
          ) : null}
        </>
      )}

      <div className="h-[56px] rounded-full bg-[#486782]/14 shadow-[0_10px_30px_rgba(72,103,130,0.08)]" />
    </div>
  );
}

function SkeletonField() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-20 rounded-full bg-[#d7e2ea]/80" />
      <div className="h-[52px] rounded-[22px] border border-[#e3e7eb] bg-[#f2efeb]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]" />
    </div>
  );
}
