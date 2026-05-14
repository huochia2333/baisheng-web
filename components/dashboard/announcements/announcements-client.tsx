"use client";

import { useMemo } from "react";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import type {
  AdminAnnouncementsPageData,
  AnnouncementAudience,
  AnnouncementStatus,
} from "@/lib/announcements";

import { EmptyState, PageBanner } from "../dashboard-shared-ui";
import { AnnouncementFormDialog } from "./announcement-form-dialog";
import {
  AnnouncementsFilterSection,
  AnnouncementsHeaderSection,
  AnnouncementsListSection,
} from "./announcements-sections";
import { useAdminAnnouncementsViewModel } from "./use-announcements-view-model";

type AdminAnnouncementsClientProps = {
  initialData: AdminAnnouncementsPageData;
};

export function AdminAnnouncementsClient({
  initialData,
}: AdminAnnouncementsClientProps) {
  const t = useTranslations("Announcements");
  const { locale } = useLocale();
  const copy = useMemo(() => createAnnouncementsCopy(t), [t]);
  const viewModel = useAdminAnnouncementsViewModel({
    copy: copy.feedback,
    initialData,
  });

  if (!viewModel.hasPermission) {
    return (
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-6">
        <EmptyState
          description={copy.noPermissionDescription}
          icon={<ShieldAlert className="size-6" />}
          title={copy.noPermissionTitle}
        />
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
        {viewModel.pageFeedback ? (
          <PageBanner tone={viewModel.pageFeedback.tone}>
            {viewModel.pageFeedback.message}
          </PageBanner>
        ) : null}

        <AnnouncementsHeaderSection
          copy={copy.header}
          onCreate={viewModel.openCreateDialog}
        />
        <AnnouncementsFilterSection
          audienceFilter={viewModel.audienceFilter}
          copy={copy.filters}
          onAudienceFilterChange={viewModel.setAudienceFilter}
          onStatusFilterChange={viewModel.setStatusFilter}
          statusFilter={viewModel.statusFilter}
        />
        <AnnouncementsListSection
          announcements={viewModel.filteredAnnouncements}
          copy={copy.list}
          locale={locale}
          onDelete={viewModel.handleDelete}
          onEdit={viewModel.openEditDialog}
          onOffline={viewModel.handleTakeOffline}
          onPublish={viewModel.handlePublish}
          pendingAction={viewModel.pendingAction}
        />
      </section>

      <AnnouncementFormDialog
        copy={copy.dialog}
        editingAnnouncement={viewModel.editingAnnouncement}
        feedback={viewModel.dialogFeedback}
        formState={viewModel.formState}
        onOpenChange={viewModel.handleDialogOpenChange}
        onSubmit={() => void viewModel.handleSubmit()}
        onUpdateField={viewModel.updateFormField}
        open={viewModel.dialogOpen}
        pending={viewModel.submitPending}
      />
    </>
  );
}

type TranslationValues = Record<string, string | number>;
type Translator = (key: string, values?: TranslationValues) => string;

function createAnnouncementsCopy(t: Translator) {
  const audienceOptions: Record<AnnouncementAudience, string> = {
    all: t("audience.all"),
    client: t("audience.client"),
    internal: t("audience.internal"),
  };
  const statusOptions: Record<AnnouncementStatus, string> = {
    draft: t("status.draft"),
    offline: t("status.offline"),
    published: t("status.published"),
  };

  return {
    dialog: {
      audienceLabel: t("dialog.audienceLabel"),
      audienceOptions,
      cancel: t("dialog.cancel"),
      contentLabel: t("dialog.contentLabel"),
      contentPlaceholder: t("dialog.contentPlaceholder"),
      createDescription: t("dialog.createDescription"),
      createSubmit: t("dialog.createSubmit"),
      createTitle: t("dialog.createTitle"),
      editDescription: t("dialog.editDescription"),
      editSubmit: t("dialog.editSubmit"),
      editTitle: t("dialog.editTitle"),
      titleLabel: t("dialog.titleLabel"),
      titlePlaceholder: t("dialog.titlePlaceholder"),
    },
    feedback: {
      createSuccess: t("feedback.createSuccess"),
      deleteConfirm: (title: string) => t("feedback.deleteConfirm", { title }),
      deleteSuccess: t("feedback.deleteSuccess"),
      missingContent: t("feedback.missingContent"),
      missingTitle: t("feedback.missingTitle"),
      notFoundError: t("feedback.notFoundError"),
      offlineSuccess: t("feedback.offlineSuccess"),
      permissionError: t("feedback.permissionError"),
      publishSuccess: t("feedback.publishSuccess"),
      unknownError: t("feedback.unknownError"),
      updateSuccess: t("feedback.updateSuccess"),
    },
    filters: {
      allAudiences: t("filters.allAudiences"),
      allStatuses: t("filters.allStatuses"),
      audienceLabel: t("filters.audienceLabel"),
      audienceOptions,
      statusLabel: t("filters.statusLabel"),
      statusOptions,
    },
    header: {
      create: t("header.create"),
      description: t("header.description"),
      title: t("header.title"),
    },
    list: {
      audienceOptions,
      createdAt: t("list.createdAt"),
      delete: t("list.delete"),
      edit: t("list.edit"),
      emptyDescription: t("list.emptyDescription"),
      emptyTitle: t("list.emptyTitle"),
      offline: t("list.offline"),
      publishedAt: t("list.publishedAt"),
      publish: t("list.publish"),
      statusOptions,
      updatedAt: t("list.updatedAt"),
    },
    noPermissionDescription: t("noPermissionDescription"),
    noPermissionTitle: t("noPermissionTitle"),
  };
}
