"use client";

import { cn } from "@/lib/utils";

type AuthFeedbackProps = {
  children: string;
  tone: "error" | "success" | "info";
};

export function AuthFeedback({ children, tone }: AuthFeedbackProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border px-4 py-3 text-sm leading-7",
        tone === "error" && "border-[#f1d1d1] bg-[#fff2f2] text-[#9f3535]",
        tone === "success" && "border-[#d6e8d8] bg-[#f1f8f2] text-[#42624b]",
        tone === "info" && "border-[#d7e2ea] bg-[#f3f7fa] text-[#49657d]",
      )}
    >
      {children}
    </div>
  );
}
