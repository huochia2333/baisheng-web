"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GitBranchPlus,
  Network,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  getReferralsPageData,
  type ReferralsPageData,
  type ReferralTreeEdge,
} from "@/lib/referrals";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { AppRole, UserStatus } from "@/lib/user-self-service";

import {
  createDashboardSharedCopy,
  EmptyState,
  formatDateTime,
  mapUserStatus,
  PageBanner,
  toErrorMessage,
  type DashboardSharedCopy,
  type NoticeTone,
} from "./dashboard-shared-ui";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { useWorkspaceSyncEffect } from "./workspace-session-provider";

type PageFeedback = { tone: NoticeTone; message: string } | null;
type TranslationValues = Record<string, string | number>;
type ReferralTranslator = (key: string, values?: TranslationValues) => string;

type ReferralPerson = {
  userId: string;
  name: string | null;
  email: string | null;
  role: AppRole | null;
  status: UserStatus | null;
  isTeamSalesman: boolean;
};

type ReferralGraph = {
  nodes: Map<string, ReferralPerson>;
  childEdgesByParent: Map<string, ReferralTreeEdge[]>;
  parentByChild: Map<string, string>;
};

type ReferralsCopy = {
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

function createReferralsCopy(t: ReferralTranslator): ReferralsCopy {
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

export function ReferralsClient({
  initialData,
}: {
  initialData: ReferralsPageData;
}) {
  const supabase = getBrowserSupabaseClient();
  const t = useTranslations("Referrals");
  const sharedT = useTranslations("DashboardShared");
  const { locale } = useLocale();
  const copy = useMemo(() => createReferralsCopy(t), [t]);
  const sharedCopy = useMemo(
    () => createDashboardSharedCopy(sharedT),
    [sharedT],
  );

  const [canViewReferrals, setCanViewReferrals] = useState(initialData.canViewReferrals);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [edges, setEdges] = useState<ReferralTreeEdge[]>(initialData.edges);
  const [currentViewerId, setCurrentViewerId] = useState<string | null>(
    initialData.currentViewerId,
  );
  const [currentViewerRole, setCurrentViewerRole] = useState<AppRole | null>(
    initialData.currentViewerRole,
  );
  const [searchText, setSearchText] = useState("");

  const applyPageData = useCallback((pageData: ReferralsPageData) => {
    setCanViewReferrals(pageData.canViewReferrals);
    setEdges(pageData.edges);
    setCurrentViewerId(pageData.currentViewerId);
    setCurrentViewerRole(pageData.currentViewerRole);
  }, []);

  const refreshReferrals = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const nextPageData = await getReferralsPageData(supabase);

        if (!isMounted()) {
          return;
        }

        applyPageData(nextPageData);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toReferralErrorMessage(error, copy, sharedCopy),
        });
      }
    },
    [applyPageData, copy, sharedCopy, supabase],
  );

  useWorkspaceSyncEffect(refreshReferrals);

  const graph = useMemo(() => buildReferralGraph(edges), [edges]);
  const sectionDescription = useMemo(
    () => getReferralSectionDescription(currentViewerRole, copy),
    [copy, currentViewerRole],
  );
  const treeDisplay = useMemo(
    () => buildTreeDisplayData(graph, searchText, locale, copy, sharedCopy),
    [copy, graph, locale, searchText, sharedCopy],
  );
  const visibleEdgeCount = useMemo(
    () =>
      edges.filter(
        (edge) =>
          treeDisplay.visibleNodeIds.has(edge.referrer_user_id) &&
          treeDisplay.visibleNodeIds.has(edge.new_user_id),
      ).length,
    [edges, treeDisplay.visibleNodeIds],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
              {t("header.badge")}
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
              {t("header.title")}
            </h2>
            {sectionDescription ? (
              <p className="mt-3 text-[15px] leading-8 text-[#65717b]">
                {sectionDescription}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[560px]">
            <DashboardMetricCard
              accent="blue"
              icon={<GitBranchPlus className="size-5" />}
              label={searchText.trim() ? t("summary.matchedEdges") : t("summary.visibleEdges")}
              value={visibleEdgeCount}
            />
            <DashboardMetricCard
              accent="green"
              icon={<UsersRound className="size-5" />}
              label={searchText.trim() ? t("summary.matchedNodes") : t("summary.visibleUsers")}
              value={treeDisplay.visibleNodeIds.size}
            />
            <DashboardMetricCard
              accent="gold"
              icon={<Network className="size-5" />}
              label={t("summary.rootNodes")}
              value={treeDisplay.rootIds.length}
            />
          </div>
        </div>
      </section>

      {canViewReferrals === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.noPermissionDescription")}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noPermissionTitle")}
          />
        </section>
      ) : edges.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description={t("states.emptyDescription")}
            icon={<Network className="size-6" />}
            title={t("states.emptyTitle")}
          />
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">
                {t("tree.title")}
              </h3>
            </div>

            <label className="flex w-full max-w-sm items-center gap-3 rounded-full border border-[#dfe5ea] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
              <Search className="size-4 text-[#7a8790]" />
              <input
                className="w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={t("tree.searchPlaceholder")}
                type="text"
                value={searchText}
              />
            </label>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
            {treeDisplay.rootIds.length === 0 ? (
              <EmptyState
                description={t("states.noMatchDescription")}
                icon={<Search className="size-6" />}
                title={t("states.noMatchTitle")}
              />
            ) : (
              <div className="min-w-[720px]">
                <div className="grid gap-6">
                  {treeDisplay.rootIds.map((rootId) => (
                    <ReferralTreeNode
                      key={rootId}
                      copy={copy}
                      currentViewerId={currentViewerId}
                      forceExpanded={searchText.trim().length > 0}
                      graph={graph}
                      incomingEdge={null}
                      isRoot
                      locale={locale}
                      matchingNodeIds={treeDisplay.matchingNodeIds}
                      nodeId={rootId}
                      sharedCopy={sharedCopy}
                      visibleNodeIds={treeDisplay.visibleNodeIds}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

function ReferralTreeNode({
  nodeId,
  graph,
  visibleNodeIds,
  matchingNodeIds,
  currentViewerId,
  incomingEdge,
  isRoot = false,
  forceExpanded,
  locale,
  copy,
  sharedCopy,
}: {
  nodeId: string;
  graph: ReferralGraph;
  visibleNodeIds: Set<string>;
  matchingNodeIds: Set<string>;
  currentViewerId: string | null;
  incomingEdge: ReferralTreeEdge | null;
  isRoot?: boolean;
  forceExpanded: boolean;
  locale: "zh" | "en";
  copy: ReferralsCopy;
  sharedCopy: DashboardSharedCopy;
}) {
  const person = graph.nodes.get(nodeId);
  const childEdges = (graph.childEdgesByParent.get(nodeId) ?? []).filter((edge) =>
    visibleNodeIds.has(edge.new_user_id),
  );
  const hasChildren = childEdges.length > 0;
  const isCurrentViewer = nodeId === currentViewerId;
  const isMatchingNode = matchingNodeIds.has(nodeId);
  const [expanded, setExpanded] = useState<boolean>(true);

  if (!person) {
    return null;
  }

  const isOpen = forceExpanded || expanded;

  return (
    <div
      className={[
        isRoot
          ? ""
          : "relative pl-6 before:absolute before:left-0 before:top-10 before:w-4 before:border-t before:border-dashed before:border-[#d7d3cb]",
      ].join(" ")}
    >
      {incomingEdge ? (
        <div className="mb-2 ml-6 flex flex-wrap items-center gap-2 text-[11px] leading-6 text-[#7b868f]">
          <span className="rounded-full bg-[#eef3f6] px-2.5 py-0.5 font-medium text-[#486782]">
            {copy.tree.referredOn(formatDateTime(incomingEdge.created_at, locale))}
          </span>
        </div>
      ) : null}

      <div
        className={[
          "rounded-[22px] border bg-white p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)] transition-colors",
          isCurrentViewer ? "border-[#8fb3cf] bg-[#f4f8fb]" : "border-[#ebe7e1]",
          isMatchingNode ? "ring-4 ring-[#d9e8f2]/70" : "",
        ].join(" ")}
      >
        <button
          className="flex w-full items-start gap-3 text-left"
          disabled={!hasChildren}
          onClick={() => {
            if (hasChildren && !forceExpanded) {
              setExpanded((current) => !current);
            }
          }}
          type="button"
        >
          <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#eef3f6] text-[#486782]">
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )
            ) : (
              <UserRound className="size-4" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3f7fa] text-[#486782]">
              {hasChildren && isOpen ? (
                <FolderOpen className="size-5" />
              ) : hasChildren ? (
                <Folder className="size-5" />
              ) : (
                <UserRound className="size-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold tracking-tight text-[#23313a]">
                  {getPersonDisplayName(person)}
                </p>
                {isCurrentViewer ? (
                  <NodeTag accent="blue">{copy.tree.currentAccount}</NodeTag>
                ) : null}
                {person.isTeamSalesman ? (
                  <NodeTag accent="green">{copy.tree.teamSales}</NodeTag>
                ) : null}
                {hasChildren ? (
                  <NodeTag accent="gold">
                    {copy.tree.downstreamCount(childEdges.length)}
                  </NodeTag>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm leading-7 text-[#6f7b85]">
                <span>{person.email ?? copy.tree.noEmail}</span>
                <span className="text-[#a6b0b7]">/</span>
                <span>{getRoleLabel(person.role, copy)}</span>
                <span className="text-[#a6b0b7]">/</span>
                <span>{mapUserStatus(person.status, sharedCopy).label}</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {hasChildren && isOpen ? (
        <div className="relative ml-6 mt-4 border-l border-dashed border-[#d7d3cb] pl-6">
          <div className="grid gap-4">
            {childEdges.map((childEdge) => (
              <ReferralTreeNode
                key={`${childEdge.referrer_user_id}-${childEdge.new_user_id}`}
                copy={copy}
                currentViewerId={currentViewerId}
                forceExpanded={forceExpanded}
                graph={graph}
                incomingEdge={childEdge}
                locale={locale}
                matchingNodeIds={matchingNodeIds}
                nodeId={childEdge.new_user_id}
                sharedCopy={sharedCopy}
                visibleNodeIds={visibleNodeIds}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NodeTag({
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

function buildReferralGraph(edges: ReferralTreeEdge[]): ReferralGraph {
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

function buildTreeDisplayData(
  graph: ReferralGraph,
  searchText: string,
  locale: "zh" | "en",
  copy: ReferralsCopy,
  sharedCopy: DashboardSharedCopy,
) {
  const normalizedSearchText = searchText.trim().toLowerCase();
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
      collectDescendantNodeIds(graph.childEdgesByParent, matchingNodeId, visibleNodeIds);
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

function getPersonDisplayName(person: ReferralPerson) {
  return person.name ?? person.email ?? person.userId;
}

function getSortablePersonLabel(person: ReferralPerson | undefined) {
  if (!person) {
    return "";
  }

  return getPersonDisplayName(person);
}

function getRoleLabel(role: AppRole | null, copy: ReferralsCopy) {
  if (role === "administrator") return copy.roles.administrator;
  if (role === "operator") return copy.roles.operator;
  if (role === "manager") return copy.roles.manager;
  if (role === "recruiter") return copy.roles.recruiter;
  if (role === "salesman") return copy.roles.salesman;
  if (role === "finance") return copy.roles.finance;
  if (role === "client") return copy.roles.client;
  return copy.roles.unknown;
}

function getReferralSectionDescription(role: AppRole | null, copy: ReferralsCopy) {
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

function toReferralErrorMessage(
  error: unknown,
  copy: ReferralsCopy,
  sharedCopy: DashboardSharedCopy,
) {
  const rawMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  const baseMessage = toErrorMessage(error, sharedCopy);

  if (
    rawMessage.includes("row-level security") ||
    baseMessage === sharedCopy.errors.permission
  ) {
    return copy.errors.noPermission;
  }

  return baseMessage;
}
