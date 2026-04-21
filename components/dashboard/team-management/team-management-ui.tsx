"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import {
  LoaderCircle,
  Search,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import type {
  TeamClient,
  TeamMember,
  TeamSalesmanCandidate,
} from "@/lib/team-management";

import { Button } from "../../ui/button";
import {
  formatDateTime,
  mapUserStatus,
} from "../dashboard-shared-ui";
import {
  getOptionalEmailLabel,
  getOptionalRecordLabel,
  getOptionalTeamAssignmentLabel,
} from "../team-management-copy";

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#6f7b85]">{description}</p>
    </div>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "blue" | "green" | "gold";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]",
        tone === "blue" ? "border-[#dde7ef] bg-[#f7fafc]" : "",
        tone === "green" ? "border-[#dce8df] bg-[#f2f7f3]" : "",
        tone === "gold" ? "border-[#eadfbf] bg-[#fbf5e8]" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-full text-white",
            tone === "blue" ? "bg-[#486782]" : "",
            tone === "green" ? "bg-[#4c7259]" : "",
            tone === "gold" ? "bg-[#b7892f]" : "",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[#23313a]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[18px] bg-[#f7f5f2] px-3 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[#23313a]">{value}</p>
    </div>
  );
}

export function InsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[22px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
      <p className="text-lg font-semibold tracking-tight text-[#23313a]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[#6f7b85]">{description}</p>
    </article>
  );
}

export function MemberCard({
  member,
  canManage,
  onRemove,
  busy,
}: {
  member: TeamMember;
  canManage: boolean;
  onRemove: (salesmanUserId: string) => Promise<void>;
  busy: boolean;
}) {
  const t = useTranslations("TeamManagement");
  const { locale } = useLocale();
  const status = mapUserStatus(member.status, locale);

  return (
    <article className="rounded-[24px] border border-[#ebe7e1] bg-white p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold tracking-tight text-[#23313a]">
              {member.name ?? member.email ?? member.user_id}
            </p>
            <DataPill accent={status.accent === "success" ? "green" : "gold"}>
              {status.label}
            </DataPill>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
            {t("memberCard.emailAndClients", {
              email: getOptionalEmailLabel(member.email, t),
              count: member.client_count,
            })}
          </p>
        </div>

        {canManage ? (
          <Button
            className="h-10 rounded-full border-[#f1d1d1] bg-[#fff2f2] px-4 text-[#b13d3d] hover:bg-[#fce5e5]"
            disabled={busy}
            onClick={() => void onRemove(member.user_id)}
            variant="outline"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <UserMinus className="size-4" />
            )}
            {t("memberCard.remove")}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo
          label={t("memberCard.joinedAt")}
          value={formatDateTime(member.joined_at, locale)}
        />
        <MiniInfo
          label={t("memberCard.accountCreatedAt")}
          value={formatDateTime(member.created_at, locale)}
        />
      </div>
    </article>
  );
}

export function CandidateCard({
  candidate,
  onAdd,
  busy,
}: {
  candidate: TeamSalesmanCandidate;
  onAdd: (salesmanUserId: string) => Promise<void>;
  busy: boolean;
}) {
  const t = useTranslations("TeamManagement");
  const { locale } = useLocale();
  const status = mapUserStatus(candidate.status, locale);

  return (
    <article className="rounded-[22px] border border-[#ebe7e1] bg-white p-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold tracking-tight text-[#23313a]">
                {candidate.name ?? candidate.email ?? candidate.user_id}
              </p>
              <DataPill accent={status.accent === "success" ? "green" : "gold"}>
                {status.label}
              </DataPill>
            </div>
            <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
              {getOptionalEmailLabel(candidate.email, t)}
            </p>
          </div>

          <Button
            className="h-10 rounded-full bg-[#486782] px-4 text-white hover:bg-[#3e5f79] disabled:bg-[#9baab6]"
            disabled={!candidate.assignable || busy}
            onClick={() => void onAdd(candidate.user_id)}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {candidate.assignable ? t("candidateCard.add") : t("candidateCard.disabled")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <MiniInfo
            label={t("candidateCard.currentTeam")}
            value={getOptionalTeamAssignmentLabel(candidate.current_team_name, t)}
          />
          <MiniInfo
            label={t("candidateCard.directClientCount")}
            value={t("candidateCard.directClientCountValue", {
              count: candidate.direct_client_count,
            })}
          />
        </div>
      </div>
    </article>
  );
}

export function ClientCard({ client }: { client: TeamClient }) {
  const t = useTranslations("TeamManagement");
  const { locale } = useLocale();
  const status = mapUserStatus(client.status, locale);

  return (
    <article className="rounded-[22px] border border-[#ebe7e1] bg-white p-5 shadow-[0_10px_24px_rgba(96,113,128,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold tracking-tight text-[#23313a]">
              {client.name ?? client.email ?? client.user_id}
            </p>
            <DataPill accent={status.accent === "success" ? "green" : "gold"}>
              {status.label}
            </DataPill>
            {client.vip_status ? (
              <DataPill accent="blue">{t("shared.pills.vip")}</DataPill>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
            {getOptionalEmailLabel(client.email, t)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo
          label={t("clientCard.referrer")}
          value={getOptionalRecordLabel(client.referrer_name, t)}
        />
        <MiniInfo
          label={t("clientCard.relatedAt")}
          value={formatDateTime(client.created_at, locale)}
        />
      </div>
    </article>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-full border border-[#dfe5ea] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
      <Search className="size-4 text-[#7a8790]" />
      <input
        className="w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

export function DataPill({
  children,
  accent,
}: {
  children: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
        accent === "blue" ? "bg-[#e4edf3] text-[#486782]" : "",
        accent === "green" ? "bg-[#e7f3ea] text-[#4c7259]" : "",
        accent === "gold" ? "bg-[#fbf1d9] text-[#9a6a07]" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f7f5f2] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#23313a]">{value}</p>
    </div>
  );
}
