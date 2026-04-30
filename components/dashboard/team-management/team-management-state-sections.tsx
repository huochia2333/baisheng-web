"use client";

import { useTranslations } from "next-intl";
import {
  BriefcaseBusiness,
  Building2,
  CirclePlus,
  Crown,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from "lucide-react";

import type { TeamManagerCandidate } from "@/lib/team-management";
import type { AppRole } from "@/lib/user-self-service";

import { Button } from "@/components/ui/button";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import {
  DashboardListSection,
  DashboardSectionPanel,
} from "@/components/dashboard/dashboard-section-panel";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";

import { getManagerCandidateLabel, getTeamManagementDescription } from "./team-management-display";
import {
  teamManagementSectionInputClassName,
} from "./team-management-section-styles";

export function TeamManagementHeroSection({
  aggregateStats,
  canManageSelectedTeam,
  busyKey,
  onRefresh,
  viewerRole,
}: {
  aggregateStats: {
    manageableTeams: number;
    teamCount: number;
    totalClients: number;
    totalMembers: number;
  };
  canManageSelectedTeam: boolean;
  busyKey: string | null;
  onRefresh: () => void;
  viewerRole: AppRole | null;
}) {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardSectionHeader
      actions={
        <>
          <Button
            className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
            disabled={busyKey !== null}
            onClick={onRefresh}
            variant="outline"
          >
            {busyKey === "refresh" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("header.refresh")}
          </Button>
          {canManageSelectedTeam ? (
            <div className="inline-flex items-center rounded-full bg-[#eef5ef] px-4 py-2 text-sm text-[#4c7259]">
              {t("header.manageableHint")}
            </div>
          ) : null}
        </>
      }
      badge={t("header.badge")}
      badgeClassName="bg-[#e6edf2]"
      description={getTeamManagementDescription(viewerRole, t)}
      metrics={[
        {
          accent: "blue",
          icon: <Building2 className="size-5" />,
          key: "teams",
          label: t("summary.visibleTeams"),
          value: aggregateStats.teamCount,
        },
        {
          accent: "green",
          icon: <UsersRound className="size-5" />,
          key: "members",
          label: t("summary.teamMembers"),
          value: aggregateStats.totalMembers,
        },
        {
          accent: "gold",
          icon: <BriefcaseBusiness className="size-5" />,
          key: "clients",
          label: t("summary.teamClients"),
          value: aggregateStats.totalClients,
        },
        {
          accent: "blue",
          icon: <Crown className="size-5" />,
          key: "manageable",
          label: t("summary.manageableTeams"),
          value: aggregateStats.manageableTeams,
        },
      ]}
      metricsClassName="sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4"
      title={t("header.title")}
    />
  );
}

export function AdminCreateTeamSection({
  busyKey,
  createManagerCandidates,
  createManagerUserIdDraft,
  createTeamNameDraft,
  onCreate,
  onCreateManagerUserIdChange,
  onCreateTeamNameChange,
}: {
  busyKey: string | null;
  createManagerCandidates: TeamManagerCandidate[];
  createManagerUserIdDraft: string;
  createTeamNameDraft: string;
  onCreate: () => void;
  onCreateManagerUserIdChange: (value: string) => void;
  onCreateTeamNameChange: (value: string) => void;
}) {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardListSection
      description={t("adminCreate.description")}
      title={t("adminCreate.title")}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {t("adminCreate.teamNameLabel")}
          </p>
          <input
            className={teamManagementSectionInputClassName}
            onChange={(event) => onCreateTeamNameChange(event.target.value)}
            placeholder={t("adminCreate.teamNamePlaceholder")}
            value={createTeamNameDraft}
          />
        </label>

        <label className="block">
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {t("adminCreate.managerLabel")}
          </p>
          <select
            className={teamManagementSectionInputClassName}
            onChange={(event) => onCreateManagerUserIdChange(event.target.value)}
            value={createManagerUserIdDraft}
          >
            <option value="">{t("shared.managerOptionNone")}</option>
            {createManagerCandidates.map((candidate) => (
              <option
                disabled={!candidate.assignable}
                key={candidate.user_id}
                value={candidate.user_id}
              >
                {getManagerCandidateLabel(candidate, t)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <Button
            className="h-12 w-full rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79] xl:w-auto"
            disabled={!createTeamNameDraft.trim() || busyKey !== null}
            onClick={onCreate}
          >
            {busyKey === "create-team" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CirclePlus className="size-4" />
            )}
            {t("adminCreate.button")}
          </Button>
        </div>
      </div>
    </DashboardListSection>
  );
}

export function NoPermissionSection() {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardListSection>
      <EmptyState
        description={t("states.noPermissionDescription")}
        icon={<ShieldAlert className="size-6" />}
        title={t("states.noPermissionTitle")}
      />
    </DashboardListSection>
  );
}

export function ManagerSetupSection({
  busyKey,
  onSave,
  onTeamNameChange,
  teamNameDraft,
}: {
  busyKey: string | null;
  onSave: () => void;
  onTeamNameChange: (value: string) => void;
  teamNameDraft: string;
}) {
  const t = useTranslations("TeamManagement");

  return (
    <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <DashboardSectionPanel>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f6] text-[#486782]">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">
              {t("managerSetup.title")}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#6f7b85]">
              {t("managerSetup.description")}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
          <label className="block">
            <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
              {t("managerSetup.teamNameLabel")}
            </p>
            <input
              className={teamManagementSectionInputClassName}
              onChange={(event) => onTeamNameChange(event.target.value)}
              placeholder={t("managerSetup.teamNamePlaceholder")}
              value={teamNameDraft}
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              disabled={!teamNameDraft.trim() || busyKey !== null}
              onClick={onSave}
            >
              {busyKey === "save-team" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Building2 className="size-4" />
              )}
              {t("managerSetup.button")}
            </Button>
          </div>
        </div>
      </DashboardSectionPanel>

      <DashboardListSection>
        <EmptyState
          description={t("managerSetup.emptyDescription")}
          icon={<UsersRound className="size-6" />}
          title={t("managerSetup.emptyTitle")}
        />
      </DashboardListSection>
    </section>
  );
}

export function NoTeamDataSection() {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardListSection>
      <EmptyState
        description={t("states.noTeamDataDescription")}
        icon={<Building2 className="size-6" />}
        title={t("states.noTeamDataTitle")}
      />
    </DashboardListSection>
  );
}
