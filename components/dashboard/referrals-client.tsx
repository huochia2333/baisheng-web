"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useRouter } from "next/navigation";
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

import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import {
  getCurrentReferralTreeViewerContext,
  getReferralTreeEdges,
  type ReferralTreeEdge,
} from "@/lib/referrals";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";
import type { AppRole, UserStatus } from "@/lib/user-self-service";

import {
  EmptyState,
  PageBanner,
  formatDateTime,
  mapUserStatus,
  toErrorMessage,
  type NoticeTone,
} from "./dashboard-shared-ui";

type PageFeedback = { tone: NoticeTone; message: string } | null;

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

export function ReferralsClient() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [canViewReferrals, setCanViewReferrals] = useState<boolean | null>(null);
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [edges, setEdges] = useState<ReferralTreeEdge[]>([]);
  const [currentViewerId, setCurrentViewerId] = useState<string | null>(null);
  const [currentViewerRole, setCurrentViewerRole] = useState<AppRole | null>(null);
  const [searchText, setSearchText] = useState("");
  const loadingStateRef = useRef(true);

  loadingStateRef.current = loading;

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  const loadReferrals = useCallback(
    async ({
      isMounted,
      showLoading,
    }: {
      isMounted: () => boolean;
      showLoading: boolean;
    }) => {
      if (!supabase) {
        return;
      }

      if (showLoading && isMounted()) {
        setLoading(true);
      }

      try {
        if (shouldRecoverBrowserCloudSyncState()) {
          recoverCloudSync();
          return;
        }

        const viewer = await getCurrentReferralTreeViewerContext(supabase);

        if (!isMounted()) {
          return;
        }

        if (!viewer) {
          router.replace("/login");
          return;
        }

        const nextCanViewReferrals = canReadReferralTreeByRole(viewer.role, viewer.status);
        setCanViewReferrals(nextCanViewReferrals);
        setCurrentViewerId(viewer.user.id);
        setCurrentViewerRole(viewer.role);
        if (!nextCanViewReferrals) {
          setEdges([]);
          setPageFeedback(null);
          return;
        }

        const nextEdges = await getReferralTreeEdges(supabase);

        if (!isMounted()) {
          return;
        }

        setEdges(nextEdges);
        setPageFeedback(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageFeedback({
          tone: "error",
          message: toReferralErrorMessage(error),
        });
      } finally {
        if (showLoading && isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, supabase],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) =>
      loadReferrals({
        isMounted,
        showLoading: loadingStateRef.current,
      }),
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      await loadReferrals({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const graph = useMemo(() => buildReferralGraph(edges), [edges]);
  const sectionDescription = useMemo(
    () => getReferralSectionDescription(currentViewerRole),
    [currentViewerRole],
  );
  const treeDisplay = useMemo(
    () => buildTreeDisplayData(graph, searchText),
    [graph, searchText],
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

  if (loading) {
    return <ReferralsLoadingState />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      {pageFeedback ? (
        <PageBanner tone={pageFeedback.tone}>{pageFeedback.message}</PageBanner>
      ) : null}

      <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#e4edf3] px-3 py-1 text-xs font-semibold text-[#486782]">
              推荐关系网络
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">推荐树</h2>
            {sectionDescription ? (
              <p className="mt-3 text-[15px] leading-8 text-[#65717b]">{sectionDescription}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[560px]">
            <SummaryCard
              accent="blue"
              count={visibleEdgeCount}
              icon={<GitBranchPlus className="size-5" />}
              label={searchText.trim() ? "匹配关系" : "可见关系"}
            />
            <SummaryCard
              accent="green"
              count={treeDisplay.visibleNodeIds.size}
              icon={<UsersRound className="size-5" />}
              label={searchText.trim() ? "匹配节点" : "可见用户"}
            />
            <SummaryCard
              accent="gold"
              count={treeDisplay.rootIds.length}
              icon={<Network className="size-5" />}
              label="根节点"
            />
          </div>
        </div>
      </section>

      {canViewReferrals === false ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前账号不是 active 状态，暂时无法查看推荐树。"
            icon={<ShieldAlert className="size-6" />}
            title="暂无查看权限"
          />
        </section>
      ) : edges.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前可见范围内还没有推荐关系。后续一旦产生邀请注册记录，这里会自动展示。"
            icon={<Network className="size-6" />}
            title="推荐树暂时为空"
          />
        </section>
      ) : treeDisplay.rootIds.length === 0 ? (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前搜索条件下没有匹配到推荐关系。可以换个姓名、邮箱或角色再试。"
            icon={<Search className="size-6" />}
            title="没有匹配结果"
          />
        </section>
      ) : (
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#23313a]">
                层级推荐树
              </h3>
            </div>

            <label className="flex w-full max-w-sm items-center gap-3 rounded-full border border-[#dfe5ea] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
              <Search className="size-4 text-[#7a8790]" />
              <input
                className="w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="搜索姓名、邮箱或角色"
                type="text"
                value={searchText}
              />
            </label>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[24px] border border-[#ebe7e1] bg-[#fbfaf8] p-5 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
            <div className="min-w-[720px]">
              <div className="grid gap-6">
                {treeDisplay.rootIds.map((rootId) => (
                  <ReferralTreeNode
                    key={rootId}
                    currentViewerId={currentViewerId}
                    forceExpanded={searchText.trim().length > 0}
                    graph={graph}
                    incomingEdge={null}
                    isRoot
                    matchingNodeIds={treeDisplay.matchingNodeIds}
                    nodeId={rootId}
                    visibleNodeIds={treeDisplay.visibleNodeIds}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

function ReferralsLoadingState() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1320px] items-center justify-center">
      <div className="rounded-[28px] border border-white/85 bg-white/72 px-6 py-5 text-sm text-[#60707d] shadow-[0_18px_45px_rgba(96,113,128,0.06)]">
        正在加载推荐关系...
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  accent: "blue" | "green" | "gold";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border px-5 py-4 shadow-[0_10px_24px_rgba(96,113,128,0.06)]",
        accent === "blue" ? "border-[#d9e3eb] bg-[#f4f8fb]" : "",
        accent === "green" ? "border-[#dce8df] bg-[#f2f7f3]" : "",
        accent === "gold" ? "border-[#eadfbf] bg-[#fbf5e8]" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-full text-white",
            accent === "blue" ? "bg-[#486782]" : "",
            accent === "green" ? "bg-[#4c7259]" : "",
            accent === "gold" ? "bg-[#b7892f]" : "",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#23313a]">{count}</p>
        </div>
      </div>
    </div>
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
}: {
  nodeId: string;
  graph: ReferralGraph;
  visibleNodeIds: Set<string>;
  matchingNodeIds: Set<string>;
  currentViewerId: string | null;
  incomingEdge: ReferralTreeEdge | null;
  isRoot?: boolean;
  forceExpanded: boolean;
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
            推荐于 {formatDateTime(incomingEdge.created_at)}
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
                {isCurrentViewer ? <NodeTag accent="blue">当前账号</NodeTag> : null}
                {person.isTeamSalesman ? <NodeTag accent="green">团队业务员</NodeTag> : null}
                {hasChildren ? <NodeTag accent="gold">{childEdges.length} 个下游</NodeTag> : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm leading-7 text-[#6f7b85]">
                <span>{person.email ?? "暂无邮箱"}</span>
                <span className="text-[#a6b0b7]">/</span>
                <span>{getRoleLabel(person.role)}</span>
                <span className="text-[#a6b0b7]">/</span>
                <span>{mapUserStatus(person.status).label}</span>
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
                currentViewerId={currentViewerId}
                forceExpanded={forceExpanded}
                graph={graph}
                incomingEdge={childEdge}
                matchingNodeIds={matchingNodeIds}
                nodeId={childEdge.new_user_id}
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

function buildTreeDisplayData(graph: ReferralGraph, searchText: string) {
  const normalizedSearchText = searchText.trim().toLowerCase();
  const matchingNodeIds = new Set<string>();
  const visibleNodeIds = new Set<string>();

  if (!normalizedSearchText) {
    for (const nodeId of graph.nodes.keys()) {
      visibleNodeIds.add(nodeId);
    }
  } else {
    for (const [nodeId, person] of graph.nodes.entries()) {
      if (matchesReferralPerson(person, normalizedSearchText)) {
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
      "zh-CN",
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

function matchesReferralPerson(person: ReferralPerson, normalizedSearchText: string) {
  const haystack = [
    person.name,
    person.email,
    getRoleLabel(person.role),
    mapUserStatus(person.status).label,
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

function canReadReferralTreeByRole(role: AppRole | null, status: UserStatus | null) {
  return status === "active" && role !== null;
}

function getRoleLabel(role: AppRole | null) {
  if (role === "administrator") return "管理员";
  if (role === "operator") return "运营";
  if (role === "manager") return "经理";
  if (role === "recruiter") return "招聘员";
  if (role === "salesman") return "业务员";
  if (role === "finance") return "财务";
  if (role === "client") return "客户";
  return "未设置角色";
}

function getReferralSectionDescription(role: AppRole | null) {
  if (role === "administrator") {
    return "";
  }

  if (role === "manager") {
    return "经理可以查看自己的上下游，以及团队业务员各自的上下游推荐关系。层级树中会对团队业务员做单独标记。";
  }

  if (role === "recruiter") {
    return "招聘员可以查看谁推荐了自己，以及自己推荐了哪些业务员，推荐树不会额外穿透其他团队关系。";
  }

  return "当前页面会展示你的直接上游和直接下游关系，并按树状层级展开，而不是分列列表。";
}

function toReferralErrorMessage(error: unknown) {
  const baseMessage = toErrorMessage(error);

  if (baseMessage.includes("row-level security")) {
    return "当前账号没有查看推荐树的权限。";
  }

  return baseMessage;
}
