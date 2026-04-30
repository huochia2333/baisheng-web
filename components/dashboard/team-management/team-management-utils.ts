import type {
  TeamClient,
  TeamMember,
  TeamSalesmanCandidate,
} from "@/lib/team-management";
import { normalizeSearchText } from "@/lib/value-normalizers";

import { mapUserStatus } from "../dashboard-shared-ui";

export function filterTeamMembers(
  members: TeamMember[],
  searchText: string,
  locale: "zh" | "en",
) {
  const normalizedSearchText = normalizeSearchText(searchText);

  if (!normalizedSearchText) {
    return members;
  }

  return members.filter((member) =>
    [
      member.name,
      member.email,
      mapUserStatus(member.status, locale).label,
      `${member.client_count}`,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}

export function filterTeamClients(
  clients: TeamClient[],
  searchText: string,
  locale: "zh" | "en",
) {
  const normalizedSearchText = normalizeSearchText(searchText);

  if (!normalizedSearchText) {
    return clients;
  }

  return clients.filter((client) =>
    [
      client.name,
      client.email,
      client.referrer_name,
      mapUserStatus(client.status, locale).label,
      client.vip_status ? "vip" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}

export function filterTeamCandidates(
  candidates: TeamSalesmanCandidate[],
  searchText: string,
  locale: "zh" | "en",
) {
  const normalizedSearchText = normalizeSearchText(searchText);

  if (!normalizedSearchText) {
    return candidates;
  }

  return candidates.filter((candidate) =>
    [
      candidate.name,
      candidate.email,
      candidate.current_team_name,
      mapUserStatus(candidate.status, locale).label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchText),
  );
}
