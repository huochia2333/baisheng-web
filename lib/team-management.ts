import type { SupabaseClient } from "@supabase/supabase-js";

import { withRequestTimeout } from "./request-timeout";
import {
  getCurrentSessionContext,
  type AppRole,
  type UserStatus,
} from "./user-self-service";

export type TeamOverview = {
  team_id: string;
  team_name: string | null;
  manager_user_id: string | null;
  manager_name: string | null;
  manager_email: string | null;
  member_count: number;
  active_member_count: number;
  client_count: number;
  vip_client_count: number;
  last_member_joined_at: string | null;
  can_manage: boolean;
};

export type TeamMember = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
  created_at: string | null;
  joined_at: string | null;
  client_count: number;
};

export type TeamClient = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
  created_at: string | null;
  referrer_user_id: string | null;
  referrer_name: string | null;
  vip_status: boolean;
};

export type TeamDetail = {
  team: TeamOverview | null;
  members: TeamMember[];
  clients: TeamClient[];
};

export type TeamSalesmanCandidate = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
  created_at: string | null;
  current_team_id: string | null;
  current_team_name: string | null;
  direct_client_count: number;
  assignable: boolean;
};

export type TeamManagerCandidate = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
  created_at: string | null;
  current_team_id: string | null;
  current_team_name: string | null;
  assignable: boolean;
};

export type TeamManagementPageData = {
  viewerRole: AppRole | null;
  viewerStatus: UserStatus | null;
  canView: boolean;
  overviews: TeamOverview[];
  detail: TeamDetail;
  selectedTeamId: string | null;
  candidateSalesmen: TeamSalesmanCandidate[];
  managerCandidates: TeamManagerCandidate[];
  createManagerCandidates: TeamManagerCandidate[];
};

export async function getVisibleTeamOverviews(
  supabase: SupabaseClient,
): Promise<TeamOverview[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_visible_team_overview"),
  );

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => normalizeTeamOverview(item))
    .filter((item): item is TeamOverview => item !== null);
}

export function canViewTeamPanel(role: AppRole | null, status: UserStatus | null) {
  if (role === "administrator") {
    return true;
  }

  return (
    status === "active" &&
    (role === "manager" || role === "operator" || role === "finance" || role === "salesman")
  );
}

export function resolvePreferredTeamId(
  overviews: TeamOverview[],
  preferredTeamId: string | null,
) {
  if (preferredTeamId && overviews.some((team) => team.team_id === preferredTeamId)) {
    return preferredTeamId;
  }

  const manageableTeam = overviews.find((team) => team.can_manage);
  return manageableTeam?.team_id ?? overviews[0]?.team_id ?? null;
}

export async function getTeamManagementPageData(
  supabase: SupabaseClient,
  preferredTeamId?: string | null,
): Promise<TeamManagementPageData> {
  const sessionContext = await getCurrentSessionContext(supabase);

  if (!sessionContext.user) {
    return createEmptyTeamManagementPageData({
      viewerRole: null,
      viewerStatus: null,
    });
  }

  if (!canViewTeamPanel(sessionContext.role, sessionContext.status)) {
    return createEmptyTeamManagementPageData({
      viewerRole: sessionContext.role,
      viewerStatus: sessionContext.status,
    });
  }

  const overviews = await getVisibleTeamOverviews(supabase);
  const selectedTeamId = resolvePreferredTeamId(overviews, preferredTeamId ?? null);
  const detail = selectedTeamId ? await getTeamDetail(supabase, selectedTeamId) : EMPTY_TEAM_DETAIL;

  const [candidateSalesmen, managerCandidates, createManagerCandidates] = await Promise.all([
    detail.team?.can_manage &&
    (sessionContext.role === "administrator" || sessionContext.role === "manager")
      ? getTeamSalesmanCandidates(supabase, detail.team.team_id)
      : Promise.resolve([]),
    sessionContext.role === "administrator" && detail.team
      ? getTeamManagerCandidates(supabase, detail.team.team_id)
      : Promise.resolve([]),
    sessionContext.role === "administrator"
      ? getTeamManagerCandidates(supabase, null)
      : Promise.resolve([]),
  ]);

  return {
    viewerRole: sessionContext.role,
    viewerStatus: sessionContext.status,
    canView: true,
    overviews,
    detail,
    selectedTeamId: detail.team?.team_id ?? selectedTeamId ?? null,
    candidateSalesmen,
    managerCandidates,
    createManagerCandidates,
  };
}

export async function getTeamDetail(
  supabase: SupabaseClient,
  teamId?: string | null,
): Promise<TeamDetail> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_team_detail", {
      p_team_id: teamId ?? null,
    }),
  );

  if (error) {
    throw error;
  }

  return normalizeTeamDetail(data);
}

export async function getTeamSalesmanCandidates(
  supabase: SupabaseClient,
  teamId?: string | null,
): Promise<TeamSalesmanCandidate[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_team_salesman_candidates", {
      p_team_id: teamId ?? null,
    }),
  );

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => normalizeTeamSalesmanCandidate(item))
    .filter((item): item is TeamSalesmanCandidate => item !== null);
}

export async function getTeamManagerCandidates(
  supabase: SupabaseClient,
  teamId?: string | null,
): Promise<TeamManagerCandidate[]> {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("get_team_manager_candidates", {
      p_team_id: teamId ?? null,
    }),
  );

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => normalizeTeamManagerCandidate(item))
    .filter((item): item is TeamManagerCandidate => item !== null);
}

export async function saveTeamProfile(
  supabase: SupabaseClient,
  options: {
    teamName: string;
    teamId?: string | null;
    managerUserId?: string | null;
  },
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("save_team_profile", {
      p_team_name: options.teamName.trim(),
      p_team_id: options.teamId ?? null,
      p_manager_user_id: options.managerUserId ?? null,
    }),
  );

  if (error) {
    throw error;
  }

  const teamId = normalizeOptionalString(data);

  if (!teamId) {
    throw new Error("team profile save did not return team id");
  }

  return teamId;
}

export async function deleteTeamProfile(
  supabase: SupabaseClient,
  teamId: string,
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("delete_team_profile", {
      p_team_id: teamId,
    }),
  );

  if (error) {
    throw error;
  }

  return normalizeOptionalString(data);
}

export async function addTeamSalesman(
  supabase: SupabaseClient,
  options: {
    teamId?: string | null;
    salesmanUserId: string;
  },
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("add_team_salesman", {
      p_team_id: options.teamId ?? null,
      p_salesman_user_id: options.salesmanUserId,
    }),
  );

  if (error) {
    throw error;
  }

  return normalizeOptionalString(data);
}

export async function removeTeamSalesman(
  supabase: SupabaseClient,
  options: {
    teamId?: string | null;
    salesmanUserId: string;
  },
) {
  const { data, error } = await withRequestTimeout(
    supabase.rpc("remove_team_salesman", {
      p_team_id: options.teamId ?? null,
      p_salesman_user_id: options.salesmanUserId,
    }),
  );

  if (error) {
    throw error;
  }

  return normalizeOptionalString(data);
}

const EMPTY_TEAM_DETAIL: TeamDetail = {
  team: null,
  members: [],
  clients: [],
};

function createEmptyTeamManagementPageData(options: {
  viewerRole: AppRole | null;
  viewerStatus: UserStatus | null;
}): TeamManagementPageData {
  return {
    viewerRole: options.viewerRole,
    viewerStatus: options.viewerStatus,
    canView: canViewTeamPanel(options.viewerRole, options.viewerStatus),
    overviews: [],
    detail: EMPTY_TEAM_DETAIL,
    selectedTeamId: null,
    candidateSalesmen: [],
    managerCandidates: [],
    createManagerCandidates: [],
  };
}

function normalizeTeamDetail(value: unknown): TeamDetail {
  if (typeof value !== "object" || value === null) {
    return EMPTY_TEAM_DETAIL;
  }

  const team =
    "team" in value ? normalizeTeamOverview((value as { team?: unknown }).team) : null;
  const members =
    "members" in value ? normalizeTeamMembers((value as { members?: unknown }).members) : [];
  const clients =
    "clients" in value ? normalizeTeamClients((value as { clients?: unknown }).clients) : [];

  return {
    team,
    members,
    clients,
  };
}

function normalizeTeamMembers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeTeamMember(item))
    .filter((item): item is TeamMember => item !== null);
}

function normalizeTeamClients(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeTeamClient(item))
    .filter((item): item is TeamClient => item !== null);
}

function normalizeTeamOverview(value: unknown): TeamOverview | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const teamId = "team_id" in value ? normalizeOptionalString(value.team_id) : null;

  if (!teamId) {
    return null;
  }

  return {
    team_id: teamId,
    team_name: "team_name" in value ? normalizeOptionalString(value.team_name) : null,
    manager_user_id:
      "manager_user_id" in value ? normalizeOptionalString(value.manager_user_id) : null,
    manager_name:
      "manager_name" in value ? normalizeOptionalString(value.manager_name) : null,
    manager_email:
      "manager_email" in value ? normalizeOptionalString(value.manager_email) : null,
    member_count: "member_count" in value ? normalizeInteger(value.member_count) : 0,
    active_member_count:
      "active_member_count" in value ? normalizeInteger(value.active_member_count) : 0,
    client_count: "client_count" in value ? normalizeInteger(value.client_count) : 0,
    vip_client_count:
      "vip_client_count" in value ? normalizeInteger(value.vip_client_count) : 0,
    last_member_joined_at:
      "last_member_joined_at" in value
        ? normalizeOptionalString(value.last_member_joined_at)
        : null,
    can_manage: "can_manage" in value && value.can_manage === true,
  };
}

function normalizeTeamMember(value: unknown): TeamMember | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const userId = "user_id" in value ? normalizeOptionalString(value.user_id) : null;

  if (!userId) {
    return null;
  }

  return {
    user_id: userId,
    name: "name" in value ? normalizeOptionalString(value.name) : null,
    email: "email" in value ? normalizeOptionalString(value.email) : null,
    status: "status" in value ? normalizeUserStatus(value.status) : null,
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
    joined_at: "joined_at" in value ? normalizeOptionalString(value.joined_at) : null,
    client_count: "client_count" in value ? normalizeInteger(value.client_count) : 0,
  };
}

function normalizeTeamClient(value: unknown): TeamClient | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const userId = "user_id" in value ? normalizeOptionalString(value.user_id) : null;

  if (!userId) {
    return null;
  }

  return {
    user_id: userId,
    name: "name" in value ? normalizeOptionalString(value.name) : null,
    email: "email" in value ? normalizeOptionalString(value.email) : null,
    status: "status" in value ? normalizeUserStatus(value.status) : null,
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
    referrer_user_id:
      "referrer_user_id" in value ? normalizeOptionalString(value.referrer_user_id) : null,
    referrer_name:
      "referrer_name" in value ? normalizeOptionalString(value.referrer_name) : null,
    vip_status: "vip_status" in value && value.vip_status === true,
  };
}

function normalizeTeamSalesmanCandidate(value: unknown): TeamSalesmanCandidate | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const userId = "user_id" in value ? normalizeOptionalString(value.user_id) : null;

  if (!userId) {
    return null;
  }

  return {
    user_id: userId,
    name: "name" in value ? normalizeOptionalString(value.name) : null,
    email: "email" in value ? normalizeOptionalString(value.email) : null,
    status: "status" in value ? normalizeUserStatus(value.status) : null,
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
    current_team_id:
      "current_team_id" in value ? normalizeOptionalString(value.current_team_id) : null,
    current_team_name:
      "current_team_name" in value ? normalizeOptionalString(value.current_team_name) : null,
    direct_client_count:
      "direct_client_count" in value ? normalizeInteger(value.direct_client_count) : 0,
    assignable: "assignable" in value && value.assignable === true,
  };
}

function normalizeTeamManagerCandidate(value: unknown): TeamManagerCandidate | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const userId = "user_id" in value ? normalizeOptionalString(value.user_id) : null;

  if (!userId) {
    return null;
  }

  return {
    user_id: userId,
    name: "name" in value ? normalizeOptionalString(value.name) : null,
    email: "email" in value ? normalizeOptionalString(value.email) : null,
    status: "status" in value ? normalizeUserStatus(value.status) : null,
    created_at: "created_at" in value ? normalizeOptionalString(value.created_at) : null,
    current_team_id:
      "current_team_id" in value ? normalizeOptionalString(value.current_team_id) : null,
    current_team_name:
      "current_team_name" in value ? normalizeOptionalString(value.current_team_name) : null,
    assignable: "assignable" in value && value.assignable === true,
  };
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeUserStatus(value: unknown): UserStatus | null {
  if (value === "inactive" || value === "active" || value === "suspended") {
    return value;
  }

  return null;
}
