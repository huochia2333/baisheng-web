import type { InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthPasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  hidePasswordLabel: string;
  hint?: string;
  hintTone?: "default" | "success" | "warning";
  label: string;
  labelAction?: ReactNode;
  showPasswordLabel: string;
};

export function AuthPasswordField({
  className,
  disabled,
  hidePasswordLabel,
  hint,
  hintTone = "default",
  label,
  labelAction,
  showPasswordLabel,
  ...props
}: AuthPasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const toggleLabel = isPasswordVisible ? hidePasswordLabel : showPasswordLabel;

  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between gap-4 px-1">
        <span className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#5d7388] uppercase">
          {label}
        </span>
        {labelAction}
      </span>
      <span className="group relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#98a3ad] transition-colors group-focus-within:text-[#486783]">
          <LockKeyhole className="size-4" />
        </span>
        <input
          className={cn(
            "h-[52px] w-full rounded-[22px] border border-[#ece9e4] bg-[#f2efeb]/90 pr-12 pl-12 text-[15px] text-[#22303a] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all placeholder:text-[#a9b1b8] focus:border-[#bfd2e1] focus:bg-white focus:ring-4 focus:ring-[#bfd2e1]/45 focus:outline-none",
            "disabled:cursor-wait disabled:opacity-80",
            className,
          )}
          disabled={disabled}
          type={isPasswordVisible ? "text" : "password"}
          {...props}
        />
        <button
          aria-label={toggleLabel}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[22px] text-[#7d8a94] transition-colors hover:text-[#486782] focus-visible:ring-2 focus-visible:ring-[#bfd2e1] focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
          disabled={disabled}
          onClick={() => setIsPasswordVisible((current) => !current)}
          type="button"
        >
          {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
      {hint ? (
        <span
          className={cn(
            "pl-1 text-xs leading-5",
            hintTone === "success" && "text-[#4f7a5b]",
            hintTone === "warning" && "text-[#9b7040]",
            hintTone === "default" && "text-[#8b959d]",
          )}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
