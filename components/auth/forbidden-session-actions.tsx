"use client";

import { useState } from "react";

import Link from "next/link";
import { Home, LoaderCircle, LogIn } from "lucide-react";

import { signOutCurrentBrowserSession } from "@/lib/browser-auth-session";
import { getBrowserSupabaseClient } from "@/lib/supabase";

type ForbiddenSessionActionsProps = {
  homeLabel: string;
  reloginLabel: string;
};

export function ForbiddenSessionActions({
  homeLabel,
  reloginLabel,
}: ForbiddenSessionActionsProps) {
  const supabase = getBrowserSupabaseClient();
  const [pending, setPending] = useState(false);

  const handleRelogin = () => {
    if (pending) {
      return;
    }

    setPending(true);

    // 清理当前浏览器保存的登录信息，再回到登录页，避免旧账号一直挡住换号登录。
    signOutCurrentBrowserSession(supabase, "/login");
  };

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#486782] px-5 text-sm font-semibold text-white transition hover:bg-[#3e5f79]"
        href="/"
      >
        <Home className="size-4 shrink-0" />
        <span className="truncate">{homeLabel}</span>
      </Link>

      <button
        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#d7e0e7] bg-white px-5 text-sm font-semibold text-[#486782] transition hover:bg-[#f3f7fa] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        onClick={handleRelogin}
        type="button"
      >
        {pending ? (
          <LoaderCircle className="size-4 shrink-0 animate-spin" />
        ) : (
          <LogIn className="size-4 shrink-0" />
        )}
        <span className="truncate">{reloginLabel}</span>
      </button>
    </div>
  );
}
