"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  ADMIN_PEOPLE_ROLE_OPTIONS,
  ADMIN_PEOPLE_STATUS_OPTIONS,
  isAdminPeopleRole,
  isAdminPeopleStatus,
  type AdminPeopleChangeLogRow,
  type AdminPeoplePageData,
  type AdminPeopleRole,
  type AdminPeopleStatus,
  type AdminPersonRow,
} from "@/lib/admin-people";

import {
  getPersonDisplayName,
  personMatchesSearch,
  type AdminPeopleRoleLabels,
  type AdminPeopleStatusLabels,
} from "./admin-people-display";

type FilterValue<T extends string> = T | "all";
type Feedback = {
  tone: "error" | "success" | "info";
  message: string;
};

type UpdateResponse = {
  person?: AdminPersonRow;
  recentChanges?: AdminPeopleChangeLogRow[];
  error?: string;
};

export function useAdminPeopleViewModel({
  initialData,
}: {
  initialData: AdminPeoplePageData;
}) {
  const t = useTranslations("AdminPeople");
  const [people, setPeople] = useState(initialData.people);
  const [recentChanges, setRecentChanges] = useState(initialData.recentChanges);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<FilterValue<AdminPeopleRole>>("all");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue<AdminPeopleStatus>>("all");
  const [selectedPerson, setSelectedPerson] = useState<AdminPersonRow | null>(null);
  const [draftRole, setDraftRole] = useState<AdminPeopleRole>("client");
  const [draftStatus, setDraftStatus] = useState<AdminPeopleStatus>("inactive");
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);

  const roleLabels = useMemo<AdminPeopleRoleLabels>(
    () => ({
      administrator: t("roles.administrator"),
      client: t("roles.client"),
      finance: t("roles.finance"),
      manager: t("roles.manager"),
      operator: t("roles.operator"),
      recruiter: t("roles.recruiter"),
      salesman: t("roles.salesman"),
    }),
    [t],
  );

  const statusLabels = useMemo<AdminPeopleStatusLabels>(
    () => ({
      active: t("statuses.active"),
      inactive: t("statuses.inactive"),
      suspended: t("statuses.suspended"),
    }),
    [t],
  );

  const summary = useMemo(() => {
    const activeCount = people.filter((person) => person.status === "active").length;
    const suspendedCount = people.filter(
      (person) => person.status === "suspended",
    ).length;
    const administratorCount = people.filter(
      (person) => person.role === "administrator",
    ).length;

    return {
      activeCount,
      administratorCount,
      suspendedCount,
      totalCount: people.length,
    };
  }, [people]);

  const filteredPeople = useMemo(
    () =>
      people.filter((person) => {
        if (roleFilter !== "all" && person.role !== roleFilter) {
          return false;
        }

        if (statusFilter !== "all" && person.status !== statusFilter) {
          return false;
        }

        return personMatchesSearch(person, searchText);
      }),
    [people, roleFilter, searchText, statusFilter],
  );

  const selectedPersonName = selectedPerson
    ? getPersonDisplayName(selectedPerson, t("fallback.unnamedUser"))
    : "";
  const dialogOpen = selectedPerson !== null;
  const selectedPersonIsCurrentViewer =
    selectedPerson?.user_id === initialData.currentViewerId;
  const hasDraftChange =
    selectedPerson !== null &&
    (selectedPerson.role !== draftRole || selectedPerson.status !== draftStatus);
  const canSaveDraft =
    dialogOpen && hasDraftChange && !selectedPersonIsCurrentViewer && !saving;

  const openAccountDialog = (person: AdminPersonRow) => {
    setFeedback(null);
    setSelectedPerson(person);
    setDraftRole(person.role ?? "client");
    setDraftStatus(person.status);
    setDraftNote("");
  };

  const closeAccountDialog = () => {
    if (saving) {
      return;
    }

    setSelectedPerson(null);
  };

  const handleDraftRoleChange = (value: string) => {
    if (isAdminPeopleRole(value)) {
      setDraftRole(value);
    }
  };

  const handleDraftStatusChange = (value: string) => {
    if (isAdminPeopleStatus(value)) {
      setDraftStatus(value);
    }
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value === "all" || isAdminPeopleRole(value) ? value : "all");
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" || isAdminPeopleStatus(value) ? value : "all");
  };

  const handleSaveAccountChange = async () => {
    if (!selectedPerson || !canSaveDraft) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/people/account", {
        body: JSON.stringify({
          targetUserId: selectedPerson.user_id,
          nextRole: draftRole,
          nextStatus: draftStatus,
          note: draftNote,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = await readUpdateResponse(response);

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message: t(`errors.${normalizeErrorCode(result.error)}`),
        });
        return;
      }

      if (!result.person) {
        setFeedback({
          tone: "error",
          message: t("errors.unknown"),
        });
        return;
      }

      setPeople((currentPeople) =>
        currentPeople.map((person) =>
          person.user_id === result.person?.user_id ? result.person : person,
        ),
      );

      if (result.recentChanges) {
        setRecentChanges(result.recentChanges);
      }

      setSelectedPerson(null);
      setFeedback({
        tone: "success",
        message: t("feedback.saved"),
      });
    } catch {
      setFeedback({
        tone: "error",
        message: t("errors.serviceUnavailable"),
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    canSaveDraft,
    currentViewerId: initialData.currentViewerId,
    dialogOpen,
    draftNote,
    draftRole,
    draftStatus,
    feedback,
    filteredPeople,
    hasPermission: initialData.hasPermission,
    people,
    recentChanges,
    roleFilter,
    roleLabels,
    roleOptions: ADMIN_PEOPLE_ROLE_OPTIONS,
    saving,
    searchText,
    selectedPerson,
    selectedPersonIsCurrentViewer,
    selectedPersonName,
    statusFilter,
    statusLabels,
    statusOptions: ADMIN_PEOPLE_STATUS_OPTIONS,
    summary,
    closeAccountDialog,
    handleDraftRoleChange,
    handleDraftStatusChange,
    handleRoleFilterChange,
    handleSaveAccountChange,
    handleStatusFilterChange,
    openAccountDialog,
    setDraftNote,
    setSearchText,
  };
}

async function readUpdateResponse(response: Response): Promise<UpdateResponse> {
  try {
    const value: unknown = await response.json();

    if (!isRecord(value)) {
      return {};
    }

    return {
      error: typeof value.error === "string" ? value.error : undefined,
      person: isAdminPersonRow(value.person) ? value.person : undefined,
      recentChanges: normalizeChangeLogs(value.recentChanges),
    };
  } catch {
    return {};
  }
}

function normalizeErrorCode(value: string | undefined) {
  switch (value) {
    case "forbidden":
    case "invalidInput":
    case "lastAdmin":
    case "noChange":
    case "notFound":
    case "selfChange":
    case "serviceUnavailable":
      return value;
    default:
      return "unknown";
  }
}

function normalizeChangeLogs(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter(isAdminPeopleChangeLogRow);
}

function isAdminPersonRow(value: unknown): value is AdminPersonRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.user_id === "string" &&
    (value.role === null || isAdminPeopleRole(value.role)) &&
    isAdminPeopleStatus(value.status) &&
    typeof value.created_at === "string"
  );
}

function isAdminPeopleChangeLogRow(
  value: unknown,
): value is AdminPeopleChangeLogRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.target_user_id === "string" &&
    (value.next_role === null || isAdminPeopleRole(value.next_role)) &&
    isAdminPeopleStatus(value.next_status) &&
    typeof value.created_at === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
