"use client";

import { useCallback, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  GitBranchPlus,
  Network,
  Package,
  Plane,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  getReferralsPageData,
  type ReferralBusinessBoard,
  type ReferralsPageData,
} from "@/lib/referrals";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { AppRole } from "@/lib/user-self-service";

import {
  createDashboardSharedCopy,
  EmptyState,
  PageBanner,
  type NoticeTone,
} from "@/components/dashboard/dashboard-shared-ui";
import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import { DashboardListSection } from "@/components/dashboard/dashboard-section-panel";
import { useWorkspaceSyncEffect } from "@/components/dashboard/workspace-session-provider";
import {
  buildReferralGraph,
  buildTreeDisplayData,
  createReferralsCopy,
  getReferralSectionDescription,
  toReferralErrorMessage,
} from "./referrals-display";
import { ReferralTreePanel } from "./referrals-tree-view";

type PageFeedback = { tone: NoticeTone; message: string } | null;

export function ReferralsClient({
  initialData,
}: {
  initialData: ReferralsPageData;
}) {
  const supabase = getBrowserSupabaseClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Referrals");
  const sharedT = useTranslations("DashboardShared");
  const { locale } = useLocale();
  const copy = useMemo(() => createReferralsCopy(t), [t]);
  const sharedCopy = useMemo(
    () => createDashboardSharedCopy(sharedT),
    [sharedT],
  );

  const [selectedBoard, setSelectedBoard] =
    useState<ReferralBusinessBoard>(initialData.businessBoard);
  const [pendingBoard, setPendingBoard] = useState<ReferralBusinessBoard | null>(
    null,
  );
  const [canViewReferrals, setCanViewReferrals] = useState(initialData.canViewReferrals);
  const [availableBoards, setAvailableBoards] = useState(
    initialData.availableBoards,
  );
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(null);
  const [edges, setEdges] = useState(initialData.edges);
  const [currentViewerId, setCurrentViewerId] = useState<string | null>(
    initialData.currentViewerId,
  );
  const [currentViewerRole, setCurrentViewerRole] = useState<AppRole | null>(
    initialData.currentViewerRole,
  );
  const [searchText, setSearchText] = useState("");

  const applyPageData = useCallback((pageData: ReferralsPageData) => {
    setAvailableBoards(pageData.availableBoards);
    setSelectedBoard(pageData.businessBoard);
    setCanViewReferrals(pageData.canViewReferrals);
    setEdges(pageData.edges);
    setCurrentViewerId(pageData.currentViewerId);
    setCurrentViewerRole(pageData.currentViewerRole);
  }, []);

  const boardTabs = useMemo(
    () =>
      availableBoards.map((board) => ({
        icon:
          board === "tourism" ? (
            <Plane className="size-4" />
          ) : (
            <Package className="size-4" />
          ),
        key: board,
        label: t(`boards.${board}`),
      })),
    [availableBoards, t],
  );

  const loadBoardData = useCallback(
    async (businessBoard: ReferralBusinessBoard) => {
      if (!supabase) {
        return;
      }

      setPendingBoard(businessBoard);

      try {
        const nextPageData = await getReferralsPageData(supabase, {
          businessBoard,
        });

        applyPageData(nextPageData);
        setPageFeedback(null);
      } catch (error) {
        setPageFeedback({
          tone: "error",
          message: toReferralErrorMessage(error, copy, sharedCopy),
        });
      } finally {
        setPendingBoard(null);
      }
    },
    [applyPageData, copy, sharedCopy, supabase],
  );

  const handleBoardChange = useCallback(
    (businessBoard: ReferralBusinessBoard) => {
      if (
        businessBoard === selectedBoard ||
        pendingBoard ||
        !availableBoards.includes(businessBoard)
      ) {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (businessBoard === "tourism") {
        nextSearchParams.delete("board");
      } else {
        nextSearchParams.set("board", businessBoard);
      }

      const queryString = nextSearchParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
      setSearchText("");
      void loadBoardData(businessBoard);
    },
    [
      loadBoardData,
      availableBoards,
      pathname,
      pendingBoard,
      router,
      searchParams,
      selectedBoard,
    ],
  );

  const refreshReferrals = useCallback(
    async ({ isMounted }: { isMounted: () => boolean }) => {
      if (!supabase) {
        return;
      }

      try {
        const nextPageData = await getReferralsPageData(supabase, {
          businessBoard: selectedBoard,
        });

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
    [applyPageData, copy, selectedBoard, sharedCopy, supabase],
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

      {boardTabs.length > 1 ? (
        <DashboardSegmentedTabs
          className="sm:w-auto"
          onChange={handleBoardChange}
          options={boardTabs}
          pendingValue={pendingBoard}
          value={selectedBoard}
        />
      ) : null}

      <DashboardSectionHeader
        badge={t("header.badge")}
        description={sectionDescription}
        metrics={[
          {
            accent: "blue",
            icon: <GitBranchPlus className="size-5" />,
            key: "edges",
            label: searchText.trim()
              ? t("summary.matchedEdges")
              : t("summary.visibleEdges"),
            value: visibleEdgeCount,
          },
          {
            accent: "green",
            icon: <UsersRound className="size-5" />,
            key: "nodes",
            label: searchText.trim()
              ? t("summary.matchedNodes")
              : t("summary.visibleUsers"),
            value: treeDisplay.visibleNodeIds.size,
          },
          {
            accent: "gold",
            icon: <Network className="size-5" />,
            key: "roots",
            label: t("summary.rootNodes"),
            value: treeDisplay.rootIds.length,
          },
        ]}
        metricsClassName="xl:min-w-[560px]"
        title={t("header.title")}
      />

      {canViewReferrals === false ? (
        <DashboardListSection>
          <EmptyState
            description={t("states.noPermissionDescription")}
            icon={<ShieldAlert className="size-6" />}
            title={t("states.noPermissionTitle")}
          />
        </DashboardListSection>
      ) : edges.length === 0 ? (
        <DashboardListSection>
          <EmptyState
            description={t("states.emptyDescription")}
            icon={<Network className="size-6" />}
            title={t("states.emptyTitle")}
          />
        </DashboardListSection>
      ) : (
        <ReferralTreePanel
          copy={copy}
          currentViewerId={currentViewerId}
          graph={graph}
          locale={locale}
          noMatchDescription={t("states.noMatchDescription")}
          noMatchTitle={t("states.noMatchTitle")}
          onSearchTextChange={setSearchText}
          searchPlaceholder={t("tree.searchPlaceholder")}
          searchText={searchText}
          sharedCopy={sharedCopy}
          title={t("tree.title")}
          treeDisplay={treeDisplay}
        />
      )}
    </section>
  );
}
