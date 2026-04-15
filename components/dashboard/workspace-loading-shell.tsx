"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  getWorkspaceConfigForPathname,
  type WorkspaceLoadingTitleKey,
} from "@/lib/workspace-config";

type WorkspaceLoadingShellProps = {
  description?: string;
  title?: string;
  titleKey?: WorkspaceLoadingTitleKey;
};

export function WorkspaceLoadingShell({
  description,
  title,
  titleKey,
}: WorkspaceLoadingShellProps) {
  const pathname = usePathname();
  const shellT = useTranslations("WorkspaceLoadingShell");
  const titleT = useTranslations("WorkspaceLoadingTitles");
  const resolvedDescription = description ?? shellT("description");
  const resolvedTitleKey =
    titleKey ?? getWorkspaceConfigForPathname(pathname)?.routeSegment;
  const resolvedTitle =
    title ?? (resolvedTitleKey ? titleT(resolvedTitleKey) : shellT("title"));

  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex w-full max-w-[1320px] flex-col gap-8"
      role="status"
    >
      <div className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="h-6 w-28 rounded-full bg-[#dfe8ee]" />
            <div className="h-10 w-64 rounded-full bg-[#e7edf2]" />
            <p className="max-w-2xl text-[15px] leading-8 text-[#65717b]">
              {resolvedDescription}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-[#486782] shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
            <LoaderCircle className="size-5 animate-spin" />
            <span className="text-sm font-medium">{resolvedTitle}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6 rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="h-8 w-56 rounded-full bg-[#ebeff2]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="h-8 w-40 rounded-full bg-[#ebeff2]" />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
      <div className="h-4 w-24 rounded-full bg-[#e3e9ee]" />
      <div className="mt-4 h-24 rounded-[18px] bg-[#eef2f5]" />
      <div className="mt-4 h-4 w-32 rounded-full bg-[#e3e9ee]" />
    </div>
  );
}

function SkeletonBlock() {
  return <div className="h-20 rounded-[20px] bg-[#eef2f5]" />;
}
