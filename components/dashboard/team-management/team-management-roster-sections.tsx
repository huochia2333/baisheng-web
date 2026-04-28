"use client";

import { useTranslations } from "next-intl";
import {
  BriefcaseBusiness,
  ShieldAlert,
  UserPlus,
  UsersRound,
} from "lucide-react";

import type { TeamClient, TeamMember, TeamSalesmanCandidate } from "@/lib/team-management";

import { DashboardListSection } from "@/components/dashboard/dashboard-section-panel";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";

import {
  CandidateCard,
  ClientCard,
  MemberCard,
  SearchField,
} from "./team-management-ui";

export function TeamMembersSection({
  busyKey,
  canManageSelectedTeam,
  filteredMembers,
  memberSearchText,
  onMemberSearchChange,
  onRemoveSalesman,
}: {
  busyKey: string | null;
  canManageSelectedTeam: boolean;
  filteredMembers: TeamMember[];
  memberSearchText: string;
  onMemberSearchChange: (value: string) => void;
  onRemoveSalesman: (salesmanUserId: string) => Promise<void>;
}) {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardListSection
      bodyClassName="space-y-6"
      description={t("members.description")}
      title={t("members.title")}
    >
      <div>
        <SearchField
          onChange={onMemberSearchChange}
          placeholder={t("members.searchPlaceholder")}
          value={memberSearchText}
        />
      </div>

      <div className="grid gap-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <MemberCard
              busy={busyKey === `remove:${member.user_id}`}
              canManage={canManageSelectedTeam}
              key={member.user_id}
              member={member}
              onRemove={onRemoveSalesman}
            />
          ))
        ) : (
          <EmptyState
            description={t("members.emptyDescription")}
            icon={<UsersRound className="size-6" />}
            title={t("members.emptyTitle")}
          />
        )}
      </div>
    </DashboardListSection>
  );
}

export function TeamCandidatesSection({
  availableCandidateCount,
  busyKey,
  canManageSelectedTeam,
  candidateSearchText,
  filteredCandidates,
  onAddSalesman,
  onCandidateSearchChange,
}: {
  availableCandidateCount: number;
  busyKey: string | null;
  canManageSelectedTeam: boolean;
  candidateSearchText: string;
  filteredCandidates: TeamSalesmanCandidate[];
  onAddSalesman: (salesmanUserId: string) => Promise<void>;
  onCandidateSearchChange: (value: string) => void;
}) {
  const t = useTranslations("TeamManagement");

  return canManageSelectedTeam ? (
    <DashboardListSection
      bodyClassName="space-y-6"
      description={t("candidates.description")}
      title={t("candidates.title")}
    >
      <div>
        <SearchField
          onChange={onCandidateSearchChange}
          placeholder={t("candidates.searchPlaceholder")}
          value={candidateSearchText}
        />
      </div>

      <div className="rounded-[22px] border border-[#d9e8dc] bg-[#edf5ef] px-4 py-3 text-sm text-[#42624b]">
        {t("candidates.availableCount", { count: availableCandidateCount })}
      </div>

      <div className="space-y-3">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <CandidateCard
              busy={busyKey === `add:${candidate.user_id}`}
              candidate={candidate}
              key={candidate.user_id}
              onAdd={onAddSalesman}
            />
          ))
        ) : (
          <EmptyState
            description={t("candidates.emptyDescription")}
            icon={<UserPlus className="size-6" />}
            title={t("candidates.emptyTitle")}
          />
        )}
      </div>
    </DashboardListSection>
  ) : (
    <DashboardListSection>
      <EmptyState
        description={t("candidates.readOnlyDescription")}
        icon={<ShieldAlert className="size-6" />}
        title={t("candidates.readOnlyTitle")}
      />
    </DashboardListSection>
  );
}

export function TeamClientsSection({
  clientSearchText,
  filteredClients,
  onClientSearchChange,
}: {
  clientSearchText: string;
  filteredClients: TeamClient[];
  onClientSearchChange: (value: string) => void;
}) {
  const t = useTranslations("TeamManagement");

  return (
    <DashboardListSection
      bodyClassName="space-y-6"
      description={t("clients.description")}
      title={t("clients.title")}
    >
      <div>
        <SearchField
          onChange={onClientSearchChange}
          placeholder={t("clients.searchPlaceholder")}
          value={clientSearchText}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <ClientCard
              client={client}
              key={`${client.user_id}-${client.created_at ?? ""}`}
            />
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              description={t("clients.emptyDescription")}
              icon={<BriefcaseBusiness className="size-6" />}
              title={t("clients.emptyTitle")}
            />
          </div>
        )}
      </div>
    </DashboardListSection>
  );
}
