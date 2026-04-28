"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Search,
  UserRound,
} from "lucide-react";

import {
  EmptyState,
  formatDateTime,
  mapUserStatus,
  type DashboardSharedCopy,
} from "@/components/dashboard/dashboard-shared-ui";
import { DashboardListSection } from "@/components/dashboard/dashboard-section-panel";
import type { ReferralTreeEdge } from "@/lib/referrals";

import {
  getPersonDisplayName,
  getRoleLabel,
  type ReferralGraph,
  type ReferralTreeDisplayData,
  type ReferralsCopy,
} from "./referrals-display";

type ReferralTreePanelProps = {
  copy: ReferralsCopy;
  currentViewerId: string | null;
  graph: ReferralGraph;
  locale: "zh" | "en";
  noMatchDescription: string;
  noMatchTitle: string;
  onSearchTextChange: (value: string) => void;
  searchPlaceholder: string;
  searchText: string;
  sharedCopy: DashboardSharedCopy;
  title: string;
  treeDisplay: ReferralTreeDisplayData;
};

export function ReferralTreePanel({
  copy,
  currentViewerId,
  graph,
  locale,
  noMatchDescription,
  noMatchTitle,
  onSearchTextChange,
  searchPlaceholder,
  searchText,
  sharedCopy,
  title,
  treeDisplay,
}: ReferralTreePanelProps) {
  return (
    <DashboardListSection
      actions={
        <label className="flex w-full max-w-sm items-center gap-3 rounded-full border border-[#dfe5ea] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)]">
          <Search className="size-4 text-[#7a8790]" />
          <input
            className="w-full bg-transparent text-sm text-[#23313a] outline-none placeholder:text-[#8a949c]"
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder={searchPlaceholder}
            type="text"
            value={searchText}
          />
        </label>
      }
      title={title}
    >
      <div className="overflow-x-auto rounded-[20px] border border-[#ebe7e1] bg-[#fbfaf8] p-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)] sm:rounded-[24px] sm:p-5">
        {treeDisplay.rootIds.length === 0 ? (
          <EmptyState
            description={noMatchDescription}
            icon={<Search className="size-6" />}
            title={noMatchTitle}
          />
        ) : (
          <div className="min-w-0 sm:min-w-[640px]">
            <div className="grid gap-4 sm:gap-6">
              {treeDisplay.rootIds.map((rootId) => (
                <ReferralTreeNode
                  copy={copy}
                  currentViewerId={currentViewerId}
                  forceExpanded={searchText.trim().length > 0}
                  graph={graph}
                  incomingEdge={null}
                  isRoot
                  key={rootId}
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
    </DashboardListSection>
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
          : "relative pl-4 before:absolute before:left-0 before:top-9 before:w-3 before:border-t before:border-dashed before:border-[#d7d3cb] sm:pl-6 sm:before:top-10 sm:before:w-4",
      ].join(" ")}
    >
      {incomingEdge ? (
        <div className="mb-2 ml-4 flex flex-wrap items-center gap-2 text-[10px] leading-6 text-[#7b868f] sm:ml-6 sm:text-[11px]">
          <span className="rounded-full bg-[#eef3f6] px-2.5 py-0.5 font-medium text-[#486782]">
            {copy.tree.referredOn(formatDateTime(incomingEdge.created_at, locale))}
          </span>
        </div>
      ) : null}

      <div
        className={[
          "rounded-[18px] border bg-white p-3 shadow-[0_10px_24px_rgba(96,113,128,0.04)] transition-colors sm:rounded-[22px] sm:p-4",
          isCurrentViewer ? "border-[#8fb3cf] bg-[#f4f8fb]" : "border-[#ebe7e1]",
          isMatchingNode ? "ring-4 ring-[#d9e8f2]/70" : "",
        ].join(" ")}
      >
        <button
          className="flex w-full items-start gap-2 text-left sm:gap-3"
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

          <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#f3f7fa] text-[#486782] sm:h-10 sm:w-10 sm:rounded-2xl">
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
                <p className="truncate text-base font-semibold tracking-tight text-[#23313a] sm:text-lg">
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
        <div className="relative ml-4 mt-3 border-l border-dashed border-[#d7d3cb] pl-4 sm:ml-6 sm:mt-4 sm:pl-6">
          <div className="grid gap-3 sm:gap-4">
            {childEdges.map((childEdge) => (
              <ReferralTreeNode
                copy={copy}
                currentViewerId={currentViewerId}
                forceExpanded={forceExpanded}
                graph={graph}
                incomingEdge={childEdge}
                key={`${childEdge.referrer_user_id}-${childEdge.new_user_id}`}
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
