"use client";

import { useTranslations } from "next-intl";
import {
  BriefcaseBusiness,
  Building2,
  Crown,
  LoaderCircle,
  Star,
  Trash2,
  UsersRound,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import type {
  TeamDetail,
  TeamManagerCandidate,
  TeamMember,
  TeamOverview,
} from "@/lib/team-management";
import type { AppRole } from "@/lib/user-self-service";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/components/dashboard/dashboard-shared-ui";
import {
  DashboardListSection,
  DashboardSectionPanel,
} from "@/components/dashboard/dashboard-section-panel";

import { DataPill, InsightCard, MetricCard, MiniMetric } from "./team-management-ui";
import {
  getManagerCandidateLabel,
  getTeamDisplayName,
  getTeamManagerLabel,
} from "./team-management-display";
import {
  teamManagementDetailInputClassName,
} from "./team-management-section-styles";

export function TeamOverviewSection({
  detailMembers,
  onSelectTeam,
  overviews,
  selectedTeamId,
  viewerRole,
}: {
  detailMembers: TeamMember[];
  onSelectTeam: (teamId: string) => void;
  overviews: TeamOverview[];
  selectedTeamId: string | null;
  viewerRole: AppRole | null;
}) {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardListSection
      description={t("overview.description")}
      title={t("overview.title")}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {overviews.map((team) => (
          <button
            key={team.team_id}
            className={[
              "rounded-[24px] border p-5 text-left shadow-[0_10px_24px_rgba(96,113,128,0.05)] transition-all",
              selectedTeamId === team.team_id
                ? "border-[#8fb3cf] bg-[#f4f8fb]"
                : "border-[#ebe7e1] bg-white hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(96,113,128,0.10)]",
            ].join(" ")}
            onClick={() => onSelectTeam(team.team_id)}
            type="button"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xl font-semibold tracking-tight text-[#23313a]">
                  {getTeamDisplayName(team.team_name, t)}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
                  {t("overview.managerPrefix", {
                    managerLabel: getTeamManagerLabel(
                      team.manager_name,
                      team.manager_email,
                      t,
                    ),
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {team.can_manage ? (
                  <DataPill accent="blue">{t("shared.pills.manageable")}</DataPill>
                ) : null}
                {selectedTeamId === team.team_id ? (
                  <DataPill accent="green">{t("shared.pills.currentView")}</DataPill>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric
                label={t("overview.metrics.members")}
                value={team.member_count}
              />
              <MiniMetric
                label={t("overview.metrics.activeMembers")}
                value={team.active_member_count}
              />
              <MiniMetric
                label={t("overview.metrics.clients")}
                value={team.client_count}
              />
              <MiniMetric
                label={t("overview.metrics.vipClients")}
                value={team.vip_client_count}
              />
            </div>

            {viewerRole === "administrator" &&
            selectedTeamId === team.team_id &&
            detailMembers.length > 0 ? (
              <div className="mt-4 rounded-[18px] bg-[#f7f5f2] px-4 py-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
                  {t("overview.memberPreview")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detailMembers.slice(0, 8).map((member) => (
                    <DataPill accent="blue" key={member.user_id}>
                      {member.name ?? member.email ?? member.user_id}
                    </DataPill>
                  ))}
                  {detailMembers.length > 8 ? (
                    <DataPill accent="gold">
                      {t("overview.moreMembers", {
                        count: detailMembers.length - 8,
                      })}
                    </DataPill>
                  ) : null}
                </div>
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </DashboardListSection>
  );
}

export function TeamDetailSummarySection({
  busyKey,
  canManageSelectedTeam,
  detailTeam,
  managerCandidates,
  managerUserIdDraft,
  onDeleteTeam,
  onManagerUserIdChange,
  onSaveTeam,
  onTeamNameChange,
  teamNameDraft,
  viewerRole,
}: {
  busyKey: string | null;
  canManageSelectedTeam: boolean;
  detailTeam: NonNullable<TeamDetail["team"]>;
  managerCandidates: TeamManagerCandidate[];
  managerUserIdDraft: string;
  onDeleteTeam: () => void;
  onManagerUserIdChange: (value: string) => void;
  onSaveTeam: () => void;
  onTeamNameChange: (value: string) => void;
  teamNameDraft: string;
  viewerRole: AppRole | null;
}) {
  const { locale } = useLocale();
  const t = useTranslations("TeamManagement");

  return (
    <DashboardSectionPanel>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-[#23313a]">
                {getTeamDisplayName(detailTeam.team_name, t)}
              </h3>
              {detailTeam.can_manage ? (
                <DataPill accent="blue">{t("shared.pills.manageable")}</DataPill>
              ) : null}
              {viewerRole === "administrator" ? (
                <DataPill accent="gold">{t("shared.pills.adminView")}</DataPill>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-7 text-[#6f7b85]">
              {t("detail.managerSummary", {
                joinedAt: formatDateTime(detailTeam.last_member_joined_at, locale),
                managerLabel: getTeamManagerLabel(
                  detailTeam.manager_name,
                  detailTeam.manager_email,
                  t,
                ),
              })}
            </p>
          </div>

          {canManageSelectedTeam ? (
            <div className="w-full max-w-[360px] rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
              <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                {t("detail.editTitle")}
              </p>
              <input
                className={teamManagementDetailInputClassName}
                onChange={(event) => onTeamNameChange(event.target.value)}
                placeholder={t("detail.teamNamePlaceholder")}
                value={teamNameDraft}
              />
              {viewerRole === "administrator" ? (
                <select
                  className={teamManagementDetailInputClassName}
                  onChange={(event) => onManagerUserIdChange(event.target.value)}
                  value={managerUserIdDraft}
                >
                  <option value="">{t("shared.managerOptionNone")}</option>
                  {managerCandidates.map((candidate) => (
                    <option
                      disabled={!candidate.assignable}
                      key={candidate.user_id}
                      value={candidate.user_id}
                    >
                      {getManagerCandidateLabel(candidate, t)}
                    </option>
                  ))}
                </select>
              ) : null}
              <Button
                className="mt-3 h-10 w-full rounded-full bg-[#486782] text-white hover:bg-[#3e5f79]"
                disabled={!teamNameDraft.trim() || busyKey !== null}
                onClick={onSaveTeam}
              >
                {busyKey === "save-team" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Building2 className="size-4" />
                )}
                {t("detail.saveButton")}
              </Button>
              {viewerRole === "administrator" ? (
                <Button
                  className="mt-3 h-10 w-full rounded-full border-[#f1d1d1] bg-[#fff2f2] text-[#b13d3d] hover:bg-[#fce5e5]"
                  disabled={busyKey !== null}
                  onClick={onDeleteTeam}
                  variant="outline"
                >
                  {busyKey === "delete-team" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {t("detail.deleteButton")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<UsersRound className="size-5" />}
            label={t("detail.metrics.members")}
            tone="blue"
            value={detailTeam.member_count}
          />
          <MetricCard
            icon={<Star className="size-5" />}
            label={t("detail.metrics.activeMembers")}
            tone="green"
            value={detailTeam.active_member_count}
          />
          <MetricCard
            icon={<BriefcaseBusiness className="size-5" />}
            label={t("detail.metrics.clients")}
            tone="gold"
            value={detailTeam.client_count}
          />
          <MetricCard
            icon={<Crown className="size-5" />}
            label={t("detail.metrics.vipClients")}
            tone="blue"
            value={detailTeam.vip_client_count}
          />
        </div>
      </div>
    </DashboardSectionPanel>
  );
}

export function TeamInsightsSection({
  clientCount,
  detailTeam,
}: {
  clientCount: number;
  detailTeam: NonNullable<TeamDetail["team"]>;
}) {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardListSection
      description={t("insights.description")}
      title={t("insights.title")}
    >
      <div className="space-y-4">
        <InsightCard
          description={
            detailTeam.active_member_count === 0
              ? t("insights.activeEmptyDescription")
              : t("insights.activeReadyDescription")
          }
          title={t("insights.activeTitle", { count: detailTeam.active_member_count })}
        />
        <InsightCard
          description={
            detailTeam.vip_client_count === 0
              ? t("insights.vipEmptyDescription")
              : t("insights.vipReadyDescription")
          }
          title={t("insights.vipTitle", { count: detailTeam.vip_client_count })}
        />
        <InsightCard
          description={t("insights.relationsDescription", { count: clientCount })}
          title={t("insights.relationsTitle", { count: clientCount })}
        />
      </div>
    </DashboardListSection>
  );
}
