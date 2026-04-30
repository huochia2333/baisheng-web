import type { ReferralTreeEdge } from "@/lib/referrals";
import type { AppRole, UserStatus } from "@/lib/user-self-service";
import { normalizeSearchText } from "@/lib/value-normalizers";

import {
  getRawErrorMessage,
  mapUserStatus,
  toErrorMessage,
  type DashboardSharedCopy,
} from "@/components/dashboard/dashboard-shared-ui";

type TranslationValues = Record<string, string | number>;
type ReferralTranslator = (key: string, values?: TranslationValues) => string;

export type ReferralPerson = {
  userId: string;
  name: string | null;
  email: string | null;
  role: AppRole | null;
  status: UserStatus | null;
  isTeamSalesman: boolean;
};

export type ReferralGraph = {
  nodes: Map<string, ReferralPerson>;
  childEdgesByParent: Map<string, ReferralTreeEdge[]>;
  parentByChild: Map<string, string>;
};

export type ReferralsCopy = {
  errors: {
    noPermission: string;
  };
  roles: {
    administrator: string;
    client: string;
    finance: string;
    manager: string;
    operator: string;
    recruiter: string;
    salesman: string;
    unknown: string;
  };
  sections: {
    default: string;
    manager: string;
    recruiter: string;
  };
  tree: {
    currentAccount: string;
    downstreamCount: (count: number) => string;
    noEmail: string;
    referredOn: (date: string) => string;
    teamSales: string;
  };
};

export type ReferralTreeDisplayData = {
  matchingNodeIds: Set<string>;
  rootIds: string[];
  visibleNodeIds: Set<string>;
};

export function createReferralsCopy(t: ReferralTranslator): ReferralsCopy {
  return {
    errors: {
      noPermission: t("errors.noPermission"),
    },
    roles: {
      administrator: t("roles.administrator"),
      client: t("roles.client"),
      finance: t("roles.finance"),
      manager: t("roles.manager"),
      operator: t("roles.operator"),
      recruiter: t("roles.recruiter"),
      salesman: t("roles.salesman"),
      unknown: t("roles.unknown"),
    },
    sections: {
      default: t("sections.default"),
      manager: t("sections.manager"),
      recruiter: t("sections.recruiter"),
    },
    tree: {
      currentAccount: t("tree.currentAccount"),
      downstreamCount: (count) => t("tree.downstreamCount", { count }),
      noEmail: t("tree.noEmail"),
      referredOn: (date) => t("tree.referredOn", { date }),
      teamSales: t("tree.teamSales"),
    },
  };
}

export function buildReferralGraph(edges: ReferralTreeEdge[]): ReferralGraph {
  const nodes = new Map<string, ReferralPerson>();
  const childEdgesByParent = new Map<string, ReferralTreeEdge[]>();
  const parentByChild = new Map<string, string>();

  for (const edge of edges) {
    nodes.set(edge.referrer_user_id, {
      userId: edge.referrer_user_id,
      name: edge.referrer_name,
      email: edge.referrer_email,
      role: edge.referrer_role,
      status: edge.referrer_status,
      isTeamSalesman: edge.referrer_is_team_salesman,
    });

    nodes.set(edge.new_user_id, {
      userId: edge.new_user_id,
      name: edge.new_user_name,
      email: edge.new_user_email,
      role: edge.new_user_role,
      status: edge.new_user_status,
      isTeamSalesman: edge.new_user_is_team_salesman,
    });

    const existingChildEdges = childEdgesByParent.get(edge.referrer_user_id) ?? [];
    existingChildEdges.push(edge);
    childEdgesByParent.set(edge.referrer_user_id, existingChildEdges);
    parentByChild.set(edge.new_user_id, edge.referrer_user_id);
  }

  for (const [parentId, childEdges] of childEdgesByParent.entries()) {
    childEdges.sort((left, right) => {
      if (left.created_at !== right.created_at) {
        return left.created_at.localeCompare(right.created_at);
      }

      return getSortablePersonLabel(nodes.get(left.new_user_id)).localeCompare(
        getSortablePersonLabel(nodes.get(right.new_user_id)),
        "zh-CN",
      );
    });

    childEdgesByParent.set(parentId, childEdges);
  }

  return {
    nodes,
    childEdgesByParent,
    parentByChild,
  };
}

export function buildTreeDisplayData(
  graph: ReferralGraph,
  searchText: string,
  locale: "zh" | "en",
  copy: ReferralsCopy,
  sharedCopy: DashboardSharedCopy,
): ReferralTreeDisplayData {
  const normalizedSearchText = normalizeSearchText(searchText);
  const matchingNodeIds = new Set<string>();
  const visibleNodeIds = new Set<string>();

  if (!normalizedSearchText) {
    for (const nodeId of graph.nodes.keys()) {
      visibleNodeIds.add(nodeId);
    }
  } else {
    for (const [nodeId, person] of graph.nodes.entries()) {
      if (matchesReferralPerson(person, normalizedSearchText, copy, sharedCopy)) {
        matchingNodeIds.add(nodeId);
      }
    }

    for (const matchingNodeId of matchingNodeIds) {
      collectAncestorNodeIds(graph.parentByChild, matchingNodeId, visibleNodeIds);
      collectDescendantNodeIds(
        graph.childEdgesByParent,
        matchingNodeId,
        visibleNodeIds,
      );
      visibleNodeIds.add(matchingNodeId);
    }
  }

  const rootIds = Array.from(visibleNodeIds).filter((nodeId) => {
    const parentId = graph.parentByChild.get(nodeId);
    return !parentId || !visibleNodeIds.has(parentId);
  });

  rootIds.sort((left, right) =>
    getSortablePersonLabel(graph.nodes.get(left)).localeCompare(
      getSortablePersonLabel(graph.nodes.get(right)),
      locale === "zh" ? "zh-CN" : "en-US",
    ),
  );

  return {
    rootIds,
    visibleNodeIds,
    matchingNodeIds,
  };
}

export function getPersonDisplayName(person: ReferralPerson) {
  return person.name ?? person.email ?? person.userId;
}

export function getRoleLabel(role: AppRole | null, copy: ReferralsCopy) {
  if (role === "administrator") return copy.roles.administrator;
  if (role === "operator") return copy.roles.operator;
  if (role === "manager") return copy.roles.manager;
  if (role === "recruiter") return copy.roles.recruiter;
  if (role === "salesman") return copy.roles.salesman;
  if (role === "finance") return copy.roles.finance;
  if (role === "client") return copy.roles.client;
  return copy.roles.unknown;
}

export function getReferralSectionDescription(
  role: AppRole | null,
  copy: ReferralsCopy,
) {
  if (role === "administrator") {
    return "";
  }

  if (role === "manager") {
    return copy.sections.manager;
  }

  if (role === "recruiter") {
    return copy.sections.recruiter;
  }

  return copy.sections.default;
}

export function toReferralErrorMessage(
  error: unknown,
  copy: ReferralsCopy,
  sharedCopy: DashboardSharedCopy,
) {
  const rawMessage = getRawErrorMessage(error);
  const baseMessage = toErrorMessage(error, sharedCopy);

  if (
    rawMessage.includes("row-level security") ||
    baseMessage === sharedCopy.errors.permission
  ) {
    return copy.errors.noPermission;
  }

  return baseMessage;
}

function collectAncestorNodeIds(
  parentByChild: Map<string, string>,
  startNodeId: string,
  visibleNodeIds: Set<string>,
) {
  let currentNodeId: string | undefined = startNodeId;

  while (currentNodeId) {
    visibleNodeIds.add(currentNodeId);
    currentNodeId = parentByChild.get(currentNodeId);
  }
}

function collectDescendantNodeIds(
  childEdgesByParent: Map<string, ReferralTreeEdge[]>,
  startNodeId: string,
  visibleNodeIds: Set<string>,
) {
  const stack = [startNodeId];

  while (stack.length > 0) {
    const currentNodeId = stack.pop();

    if (!currentNodeId) {
      continue;
    }

    visibleNodeIds.add(currentNodeId);

    for (const childEdge of childEdgesByParent.get(currentNodeId) ?? []) {
      if (!visibleNodeIds.has(childEdge.new_user_id)) {
        stack.push(childEdge.new_user_id);
      }
    }
  }
}

function matchesReferralPerson(
  person: ReferralPerson,
  normalizedSearchText: string,
  copy: ReferralsCopy,
  sharedCopy: DashboardSharedCopy,
) {
  const haystack = [
    person.name,
    person.email,
    getRoleLabel(person.role, copy),
    mapUserStatus(person.status, sharedCopy).label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedSearchText);
}

function getSortablePersonLabel(person: ReferralPerson | undefined) {
  if (!person) {
    return "";
  }

  return getPersonDisplayName(person);
}
