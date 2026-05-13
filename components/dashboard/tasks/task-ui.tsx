"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import { Globe2, Search, UsersRound } from "lucide-react";

import type { TaskScope, TaskStatus } from "@/lib/admin-tasks";
import { DashboardPill, type DashboardPillAccent } from "../dashboard-pill";
import {
  DashboardSearchInput,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import {
  getTaskScopeLabel,
  getTaskStatusMeta,
} from "./tasks-display";

export function TaskSearchField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <DashboardSearchInput
        icon={<Search className="size-4 text-[#7a8790]" />}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export function TaskFilterField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </span>
      <select
        className={dashboardFilterInputClassName}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const sharedT = useTranslations("Tasks.shared");
  const mapping = getTaskStatusMeta(status, sharedT);

  return <DashboardPill accent={mapping.accent}>{mapping.label}</DashboardPill>;
}

export function TaskScopePill({ scope }: { scope: TaskScope }) {
  const sharedT = useTranslations("Tasks.shared");

  return (
    <DashboardPill accent={scope === "public" ? "blue" : "green"}>
      {scope === "public" ? (
        <Globe2 className="size-3.5" />
      ) : (
        <UsersRound className="size-3.5" />
      )}
      {getTaskScopeLabel(scope, sharedT)}
    </DashboardPill>
  );
}

export function TaskDataPill({
  children,
  accent,
}: {
  children: ReactNode;
  accent: Extract<DashboardPillAccent, "blue" | "gold">;
}) {
  return (
    <DashboardPill accent={accent} className="max-w-full font-medium">
      {children}
    </DashboardPill>
  );
}

export function TaskInfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-[#f7f5f2] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium leading-7 text-[#23313a]">
        {value}
      </p>
    </div>
  );
}
