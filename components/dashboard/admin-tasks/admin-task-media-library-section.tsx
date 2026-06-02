"use client";

import type { ReactNode } from "react";

import {
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  File,
  FileText,
  Images,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  AdminTaskMediaLibraryItem,
  AdminTaskMediaLibraryKind,
} from "@/lib/admin-task-media-library";
import { cn } from "@/lib/utils";

import {
  DashboardFilterField,
  DashboardFilterPanel,
  DashboardListSection,
  DashboardSearchInput,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import {
  EmptyState,
  formatDateTime,
  formatFileSize,
} from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";

import {
  canPreviewTaskFile,
} from "./admin-task-file-preview-dialog";
import type {
  AdminTaskMediaLibraryKindFilter,
} from "./use-admin-task-media-library";

export function AdminTaskMediaLibrarySection({
  busyItemId,
  canView,
  filteredItems,
  isRefreshing,
  items,
  kindFilter,
  onDownload,
  onKindFilterChange,
  onPreview,
  onRefresh,
  onSearchTextChange,
  searchText,
}: {
  busyItemId: string | null;
  canView: boolean;
  filteredItems: AdminTaskMediaLibraryItem[];
  isRefreshing: boolean;
  items: AdminTaskMediaLibraryItem[];
  kindFilter: AdminTaskMediaLibraryKindFilter;
  onDownload: (item: AdminTaskMediaLibraryItem) => void;
  onKindFilterChange: (value: AdminTaskMediaLibraryKindFilter) => void;
  onPreview: (item: AdminTaskMediaLibraryItem) => void;
  onRefresh: () => void;
  onSearchTextChange: (value: string) => void;
  searchText: string;
}) {
  const t = useTranslations("Tasks.admin.mediaLibrary");

  if (!canView) {
    return (
      <DashboardListSection>
        <EmptyState
          description={t("noPermissionDescription")}
          icon={<ShieldAlert className="size-6" />}
          title={t("noPermissionTitle")}
        />
      </DashboardListSection>
    );
  }

  return (
    <DashboardListSection
      actions={
        <Button
          className="h-10 rounded-full border border-[#d8e2e8] bg-white px-4 text-[#486782] hover:bg-[#eef3f6]"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
          variant="outline"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          {t("refresh")}
        </Button>
      }
      description={t("description", { count: items.length })}
      eyebrow={t("badge")}
      title={t("title")}
    >
      <div className="space-y-5">
        <DashboardFilterPanel gridClassName="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px]">
          <DashboardFilterField label={t("searchLabel")}>
            <DashboardSearchInput
              icon={<Search className="size-4 text-[#7d8890]" />}
              onChange={onSearchTextChange}
              placeholder={t("searchPlaceholder")}
              value={searchText}
            />
          </DashboardFilterField>

          <DashboardFilterField label={t("kindLabel")}>
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) =>
                onKindFilterChange(event.target.value as AdminTaskMediaLibraryKindFilter)
              }
              value={kindFilter}
            >
              <option value="all">{t("kindAll")}</option>
              <option value="image">{t("kindImage")}</option>
              <option value="video">{t("kindVideo")}</option>
              <option value="pdf">{t("kindPdf")}</option>
              <option value="file">{t("kindFile")}</option>
            </select>
          </DashboardFilterField>
        </DashboardFilterPanel>

        {items.length === 0 ? (
          <EmptyState
            description={t("emptyDescription")}
            icon={<Images className="size-6" />}
            title={t("emptyTitle")}
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            description={t("noMatchesDescription")}
            icon={<Search className="size-6" />}
            title={t("noMatchesTitle")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredItems.map((item) => (
              <TaskMediaLibraryCard
                busy={busyItemId === item.id}
                item={item}
                key={item.id}
                onDownload={onDownload}
                onPreview={onPreview}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardListSection>
  );
}

function TaskMediaLibraryCard({
  busy,
  item,
  onDownload,
  onPreview,
}: {
  busy: boolean;
  item: AdminTaskMediaLibraryItem;
  onDownload: (item: AdminTaskMediaLibraryItem) => void;
  onPreview: (item: AdminTaskMediaLibraryItem) => void;
}) {
  const t = useTranslations("Tasks.admin.mediaLibrary");
  const previewable = canPreviewTaskFile(item.kind);

  return (
    <article className="min-w-0 rounded-[24px] border border-[#e6ebef] bg-white p-4 shadow-[0_10px_24px_rgba(96,113,128,0.04)] sm:p-5">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]",
            item.kind === "image" && "bg-[#eef3f6] text-[#486782]",
            item.kind === "video" && "bg-[#edf6f1] text-[#4c7259]",
            item.kind === "pdf" && "bg-[#fbf1d9] text-[#9a6a07]",
            item.kind === "file" && "bg-[#f1f4f6] text-[#5f6972]",
          )}
        >
          {getKindIcon(item.kind)}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-base font-semibold text-[#23313a]"
            title={item.original_name}
          >
            {item.original_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6f7b85]">
            <Badge>{getKindLabel(item.kind, t)}</Badge>
            <span>{formatFileSize(item.file_size_bytes)}</span>
            <span>{t("round", { round: item.submission_round })}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoTile
          icon={<ClipboardList className="size-4 text-[#486782]" />}
          label={t("taskLabel")}
          value={item.task_name}
        />
        <InfoTile
          icon={<FileText className="size-4 text-[#486782]" />}
          label={t("typeLabel")}
          value={item.task_type_name ?? item.task_type_code}
        />
        <InfoTile
          icon={<UserRound className="size-4 text-[#486782]" />}
          label={t("submitterLabel")}
          value={getDisplayName(item.submitted_by_name, item.submitted_by_email, t)}
        />
        <InfoTile
          icon={<CheckCircle2 className="size-4 text-[#486782]" />}
          label={t("reviewedAtLabel")}
          value={formatDateTime(item.reviewed_at)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {previewable ? (
          <Button
            className="h-9 rounded-full border border-[#d8e2e8] bg-white px-3 text-xs text-[#486782] hover:bg-[#eef3f6]"
            disabled={busy}
            onClick={() => onPreview(item)}
            type="button"
            variant="outline"
          >
            {busy ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {t("preview")}
          </Button>
        ) : null}
        <Button
          className="h-9 rounded-full bg-[#486782] px-3 text-xs text-white hover:bg-[#3e5f79]"
          disabled={busy}
          onClick={() => onDownload(item)}
          type="button"
        >
          {busy ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {t("download")}
        </Button>
      </div>
    </article>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#eef3f6] px-2.5 py-1 font-medium text-[#486782]">
      {children}
    </span>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[18px] bg-[#f7f5f2] px-3 py-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-[#88939b] uppercase">
        {icon}
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <p className="mt-2 min-w-0 break-words text-sm font-medium leading-6 text-[#23313a] [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function getKindIcon(kind: AdminTaskMediaLibraryKind) {
  if (kind === "image") {
    return <Images className="size-5" />;
  }

  if (kind === "video") {
    return <Video className="size-5" />;
  }

  if (kind === "pdf") {
    return <FileText className="size-5" />;
  }

  return <File className="size-5" />;
}

function getKindLabel(
  kind: AdminTaskMediaLibraryKind,
  t: ReturnType<typeof useTranslations>,
) {
  if (kind === "image") {
    return t("kindImage");
  }

  if (kind === "video") {
    return t("kindVideo");
  }

  if (kind === "pdf") {
    return t("kindPdf");
  }

  return t("kindFile");
}

function getDisplayName(
  name: string | null,
  email: string | null,
  t: ReturnType<typeof useTranslations>,
) {
  return name ?? email ?? t("unknownUser");
}
