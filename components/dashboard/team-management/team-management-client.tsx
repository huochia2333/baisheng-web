"use client";

import { PageBanner } from "@/components/dashboard/dashboard-shared-ui";

import {
  AdminCreateTeamSection,
  ManagerSetupSection,
  NoPermissionSection,
  NoTeamDataSection,
  TeamCandidatesSection,
  TeamClientsSection,
  TeamDetailSummarySection,
  TeamInsightsSection,
  TeamManagementHeroSection,
  TeamMembersSection,
  TeamOverviewSection,
} from "./team-management-sections";
import { useTeamManagementViewModel } from "./use-team-management-view-model";
import { type TeamManagementPageData } from "@/lib/team-management";

export function TeamManagementClient({
  initialData,
}: {
  initialData: TeamManagementPageData;
}) {
  const viewModel = useTeamManagementViewModel({
    initialData,
  });

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {viewModel.pageFeedback ? (
        <PageBanner tone={viewModel.pageFeedback.tone}>
          {viewModel.pageFeedback.message}
        </PageBanner>
      ) : null}

      <TeamManagementHeroSection
        aggregateStats={viewModel.aggregateStats}
        canManageSelectedTeam={viewModel.canManageSelectedTeam}
        busyKey={viewModel.busyKey}
        onRefresh={() => void viewModel.handleRefresh()}
        viewerRole={viewModel.viewerRole}
      />

      {viewModel.canView && viewModel.viewerRole === "administrator" ? (
        <AdminCreateTeamSection
          busyKey={viewModel.busyKey}
          createManagerCandidates={viewModel.createManagerCandidates}
          createManagerUserIdDraft={viewModel.createManagerUserIdDraft}
          createTeamNameDraft={viewModel.createTeamNameDraft}
          onCreate={() => void viewModel.handleCreateTeam()}
          onCreateManagerUserIdChange={viewModel.updateCreateManagerUserIdDraft}
          onCreateTeamNameChange={viewModel.updateCreateTeamNameDraft}
        />
      ) : null}

      {!viewModel.canView ? (
        <NoPermissionSection />
      ) : viewModel.viewerRole === "manager" && viewModel.overviews.length === 0 ? (
        <ManagerSetupSection
          busyKey={viewModel.busyKey}
          onSave={() => void viewModel.handleSaveTeam()}
          onTeamNameChange={viewModel.updateTeamNameDraft}
          teamNameDraft={viewModel.teamNameDraft}
        />
      ) : viewModel.overviews.length === 0 ? (
        <NoTeamDataSection />
      ) : (
        <>
          {viewModel.overviews.length > 1 || viewModel.viewerRole !== "manager" ? (
            <TeamOverviewSection
              detailMembers={viewModel.detail.members}
              onSelectTeam={(teamId) => void viewModel.handleSelectTeam(teamId)}
              overviews={viewModel.overviews}
              selectedTeamId={viewModel.selectedTeamId}
              viewerRole={viewModel.viewerRole}
            />
          ) : null}

          {viewModel.detail.team ? (
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <TeamDetailSummarySection
                busyKey={viewModel.busyKey}
                canManageSelectedTeam={viewModel.canManageSelectedTeam}
                detailTeam={viewModel.detail.team}
                managerCandidates={viewModel.managerCandidates}
                managerUserIdDraft={viewModel.managerUserIdDraft}
                onDeleteTeam={() => void viewModel.handleDeleteTeam()}
                onManagerUserIdChange={viewModel.updateManagerUserIdDraft}
                onSaveTeam={() => void viewModel.handleSaveTeam()}
                onTeamNameChange={viewModel.updateTeamNameDraft}
                teamNameDraft={viewModel.teamNameDraft}
                viewerRole={viewModel.viewerRole}
              />
              <TeamInsightsSection
                clientCount={viewModel.detail.clients.length}
                detailTeam={viewModel.detail.team}
              />
            </section>
          ) : null}

          {viewModel.detail.team ? (
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <TeamMembersSection
                busyKey={viewModel.busyKey}
                canManageSelectedTeam={viewModel.canManageSelectedTeam}
                filteredMembers={viewModel.filteredMembers}
                memberSearchText={viewModel.memberSearchText}
                onMemberSearchChange={viewModel.setMemberSearchText}
                onRemoveSalesman={viewModel.handleRemoveSalesman}
              />
              <TeamCandidatesSection
                availableCandidateCount={viewModel.availableCandidateCount}
                busyKey={viewModel.busyKey}
                canManageSelectedTeam={viewModel.canManageSelectedTeam}
                candidateSearchText={viewModel.candidateSearchText}
                filteredCandidates={viewModel.filteredCandidates}
                onAddSalesman={viewModel.handleAddSalesman}
                onCandidateSearchChange={viewModel.setCandidateSearchText}
              />
            </section>
          ) : null}

          {viewModel.detail.team ? (
            <TeamClientsSection
              clientSearchText={viewModel.clientSearchText}
              filteredClients={viewModel.filteredClients}
              onClientSearchChange={viewModel.setClientSearchText}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
