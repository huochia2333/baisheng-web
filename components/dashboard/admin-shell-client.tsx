"use client";

import { useState } from "react";

import { LoaderCircle, LogOut } from "lucide-react";

import { signOutCurrentBrowserSession } from "@/lib/browser-auth-session";
import { getBrowserSupabaseClient } from "@/lib/supabase";

type AdminShellLogoutButtonProps = {
  label: string;
};

export function AdminShellLogoutButton({
  label,
}: AdminShellLogoutButtonProps) {
  const supabase = getBrowserSupabaseClient();
  const [pending, setPending] = useState(false);

  const handleLogout = () => {
    if (pending) {
      return;
    }

    setPending(true);
    signOutCurrentBrowserSession(supabase);
  };

  return (
    <div className="mt-auto px-1">
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fceaea] py-3 text-sm font-semibold text-[#c43d3d] transition-colors hover:bg-[#f8dddd] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        onClick={handleLogout}
        type="button"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        {label}
      </button>
    </div>
  );
}
