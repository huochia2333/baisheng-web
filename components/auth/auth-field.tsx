import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  label: string;
  hint?: string;
};

export function AuthField({
  className,
  icon,
  label,
  hint,
  ...props
}: AuthFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="pl-1 font-label text-[11px] font-semibold tracking-[0.18em] text-[#5d7388] uppercase">
        {label}
      </span>
      <div className="group relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#98a3ad] transition-colors group-focus-within:text-[#486783]">
          {icon}
        </span>
        <input
          className={cn(
            "h-[52px] w-full rounded-[22px] border border-[#ece9e4] bg-[#f2efeb]/90 pl-12 pr-4 text-[15px] text-[#22303a] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all placeholder:text-[#a9b1b8] focus:border-[#bfd2e1] focus:bg-white focus:ring-4 focus:ring-[#bfd2e1]/45 focus:outline-none",
            "disabled:cursor-wait disabled:opacity-80",
            className,
          )}
          {...props}
        />
      </div>
      {hint ? <span className="pl-1 text-xs text-[#8b959d]">{hint}</span> : null}
    </label>
  );
}
