"use client";

import {
  Edit3,
  LoaderCircle,
  Megaphone,
  Radio,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  AnnouncementAudience,
  AnnouncementRow,
  AnnouncementStatus,
} from "@/lib/announcements";

import { DashboardSectionHeader } from "../dashboard-section-header";
import {
  DashboardFilterField,
  DashboardFilterPanel,
  DashboardListSection,
  dashboardFilterInputClassName,
} from "../dashboard-section-panel";
import { EmptyState } from "../dashboard-shared-ui";
import {
  announcementAudienceValues,
  announcementStatusValues,
  formatAnnouncementDate,
} from "./announcements-display";

type AnnouncementsHeaderSectionProps = {
  copy: {
    create: string;
    description: string;
    title: string;
  };
  onCreate: () => void;
};

type AnnouncementsFilterSectionProps = {
  audienceFilter: AnnouncementAudience | "all";
  copy: {
    allAudiences: string;
    allStatuses: string;
    audienceLabel: string;
    audienceOptions: Record<AnnouncementAudience, string>;
    statusLabel: string;
    statusOptions: Record<AnnouncementStatus, string>;
  };
  onAudienceFilterChange: (value: AnnouncementAudience | "all") => void;
  onStatusFilterChange: (value: AnnouncementStatus | "all") => void;
  statusFilter: AnnouncementStatus | "all";
};

type AnnouncementsListSectionProps = {
  announcements: AnnouncementRow[];
  copy: {
    audienceOptions: Record<AnnouncementAudience, string>;
    createdAt: string;
    delete: string;
    edit: string;
    emptyDescription: string;
    emptyTitle: string;
    offline: string;
    publishedAt: string;
    publish: string;
    statusOptions: Record<AnnouncementStatus, string>;
    updatedAt: string;
  };
  locale: string;
  onDelete: (announcement: AnnouncementRow) => void;
  onEdit: (announcement: AnnouncementRow) => void;
  onOffline: (announcement: AnnouncementRow) => void;
  onPublish: (announcement: AnnouncementRow) => void;
  pendingAction: {
    id: string;
    type: "delete" | "offline" | "publish";
  } | null;
};

export function AnnouncementsHeaderSection({
  copy,
  onCreate,
}: AnnouncementsHeaderSectionProps) {
  return (
    <DashboardSectionHeader
      actions={
        <Button
          className="h-12 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
          onClick={onCreate}
        >
          <Megaphone className="size-4" />
          {copy.create}
        </Button>
      }
      badge={copy.title}
      badgeClassName="bg-[#dff0e4] text-[#487155]"
      badgeIcon={<Megaphone className="size-3.5" />}
      description={copy.description}
      descriptionClassName="max-w-2xl text-sm leading-7"
      title={copy.title}
      titleClassName="text-3xl sm:text-4xl"
    />
  );
}

export function AnnouncementsFilterSection({
  audienceFilter,
  copy,
  onAudienceFilterChange,
  onStatusFilterChange,
  statusFilter,
}: AnnouncementsFilterSectionProps) {
  return (
    <DashboardFilterPanel gridClassName="md:grid-cols-2" variant="standalone">
        <DashboardFilterField label={copy.statusLabel}>
          <select
            className={dashboardFilterInputClassName}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as AnnouncementStatus | "all")
            }
            value={statusFilter}
          >
            <option value="all">{copy.allStatuses}</option>
            {announcementStatusValues.map((status) => (
              <option key={status} value={status}>
                {copy.statusOptions[status]}
              </option>
            ))}
          </select>
        </DashboardFilterField>

        <DashboardFilterField label={copy.audienceLabel}>
          <select
            className={dashboardFilterInputClassName}
            onChange={(event) =>
              onAudienceFilterChange(
                event.target.value as AnnouncementAudience | "all",
              )
            }
            value={audienceFilter}
          >
            <option value="all">{copy.allAudiences}</option>
            {announcementAudienceValues.map((audience) => (
              <option key={audience} value={audience}>
                {copy.audienceOptions[audience]}
              </option>
            ))}
          </select>
        </DashboardFilterField>
    </DashboardFilterPanel>
  );
}

export function AnnouncementsListSection({
  announcements,
  copy,
  locale,
  onDelete,
  onEdit,
  onOffline,
  onPublish,
  pendingAction,
}: AnnouncementsListSectionProps) {
  return (
    <DashboardListSection>
      {announcements.length === 0 ? (
        <EmptyState
          description={copy.emptyDescription}
          icon={<Search className="size-6" />}
          title={copy.emptyTitle}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const actionPending = pendingAction?.id === announcement.id;
            const deletePending =
              actionPending && pendingAction?.type === "delete";
            const offlinePending =
              actionPending && pendingAction?.type === "offline";
            const publishPending =
              actionPending && pendingAction?.type === "publish";

            return (
              <article
                className="rounded-[24px] border border-[#e2e7eb] bg-[#fbfaf8] p-5"
                key={announcement.id}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={announcement.status}>
                        {copy.statusOptions[announcement.status]}
                      </StatusBadge>
                      <span className="inline-flex min-h-7 items-center rounded-full bg-[#edf3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
                        {copy.audienceOptions[announcement.audience]}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-[#23313a]">
                      {announcement.title}
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#53616d]">
                      {announcement.content}
                    </p>
                    <dl className="mt-4 grid gap-2 text-xs text-[#7b858d] sm:grid-cols-3">
                      <DateMeta
                        label={copy.publishedAt}
                        value={formatAnnouncementDate(
                          announcement.published_at,
                          locale,
                        )}
                      />
                      <DateMeta
                        label={copy.updatedAt}
                        value={formatAnnouncementDate(announcement.updated_at, locale)}
                      />
                      <DateMeta
                        label={copy.createdAt}
                        value={formatAnnouncementDate(announcement.created_at, locale)}
                      />
                    </dl>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button
                      className="h-10 rounded-full border-[#d4d8dc] bg-white px-4 text-[#486782] hover:bg-[#f2f4f6]"
                      disabled={actionPending}
                      onClick={() => onEdit(announcement)}
                      variant="outline"
                    >
                      <Edit3 className="size-4" />
                      {copy.edit}
                    </Button>
                    {announcement.status === "published" ? (
                      <Button
                        className="h-10 rounded-full border-[#e5c6c6] bg-white px-4 text-[#b64a4a] hover:bg-[#fff2f2]"
                        disabled={actionPending}
                        onClick={() => onOffline(announcement)}
                        variant="outline"
                      >
                        {offlinePending ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Radio className="size-4" />
                        )}
                        {copy.offline}
                      </Button>
                    ) : (
                      <Button
                        className="h-10 rounded-full bg-[#486782] px-4 text-white hover:bg-[#3e5f79]"
                        disabled={actionPending}
                        onClick={() => onPublish(announcement)}
                      >
                        {publishPending ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Radio className="size-4" />
                        )}
                        {copy.publish}
                      </Button>
                    )}
                    <Button
                      className="h-10 rounded-full border-[#e5c6c6] bg-white px-4 text-[#b64a4a] hover:bg-[#fff2f2]"
                      disabled={actionPending}
                      onClick={() => onDelete(announcement)}
                      variant="outline"
                    >
                      {deletePending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      {copy.delete}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardListSection>
  );
}

function StatusBadge({
  children,
  status,
}: {
  children: string;
  status: AnnouncementStatus;
}) {
  const className =
    status === "published"
      ? "bg-[#e8f4ec] text-[#4c7259]"
      : status === "draft"
        ? "bg-[#fff5db] text-[#9a6a07]"
        : "bg-[#f1efeb] text-[#69747d]";

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function DateMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#596773]">{label}</dt>
      <dd className="mt-1">{value || "-"}</dd>
    </div>
  );
}
