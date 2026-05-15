"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  ADMIN_PEOPLE_ROLE_OPTIONS,
  ADMIN_PEOPLE_STATUS_OPTIONS,
  isAdminPeopleRole,
  isAdminPeopleStatus,
  type AdminPeoplePageData,
  type AdminPeopleRole,
  type AdminPeopleStatus,
  type AdminPersonRow,
} from "@/lib/admin-people";
import {
  SALESMAN_BUSINESS_BOARD_OPTIONS,
  areSalesmanBusinessBoardsEqual,
  uniqueSalesmanBusinessBoards,
  type SalesmanBusinessBoard,
  type SalesmanBusinessBoardLabels,
} from "@/lib/salesman-business-access";

import {
  getPersonDisplayName,
  personMatchesSearch,
  type AdminPeopleRoleLabels,
  type AdminPeopleStatusLabels,
} from "./admin-people-display";
import {
  normalizeAdminPeopleErrorCode,
  readAdminPeopleUpdateResponse,
  type AdminPeopleFeedback,
} from "./admin-people-view-model-utils";
import { useAdminCustomerTypeMark } from "./use-admin-customer-type-mark";

type FilterValue<T extends string> = T | "all";

export function useAdminPeopleViewModel({
  initialData,
}: {
  initialData: AdminPeoplePageData;
}) {
  const t = useTranslations("AdminPeople");
  const [people, setPeople] = useState(initialData.people);
  const [recentChanges, setRecentChanges] = useState(initialData.recentChanges);
  const [feedback, setFeedback] = useState<AdminPeopleFeedback | null>(null);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<FilterValue<AdminPeopleRole>>("all");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue<AdminPeopleStatus>>("all");
  const [selectedPerson, setSelectedPerson] = useState<AdminPersonRow | null>(null);
  const [draftRole, setDraftRole] = useState<AdminPeopleRole>("client");
  const [draftStatus, setDraftStatus] = useState<AdminPeopleStatus>("inactive");
  const [draftBusinessBoards, setDraftBusinessBoards] = useState<
    SalesmanBusinessBoard[]
  >(["tourism"]);
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

  const businessBoardLabels = useMemo<SalesmanBusinessBoardLabels>(
    () => ({
      dropshipping: t("businessBoards.dropshipping"),
      tourism: t("businessBoards.tourism"),
    }),
    [t],
  );
  const customerTypeEditor = useAdminCustomerTypeMark({
    setFeedback,
    setPeople,
  });

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
  const accountWillChange =
    selectedPerson !== null &&
    (selectedPerson.role !== draftRole || selectedPerson.status !== draftStatus);
  const businessAccessWillChange =
    selectedPerson !== null &&
    isDraftBusinessAccessChanged(selectedPerson, draftRole, draftBusinessBoards);
  const customerTypeWillChange = customerTypeEditor.customerTypeWillChange(
    selectedPerson,
    draftRole,
  );
  const hasDraftChange =
    accountWillChange || businessAccessWillChange || customerTypeWillChange;
  const canSaveDraft =
    dialogOpen && hasDraftChange && !selectedPersonIsCurrentViewer && !saving;

  const openAccountDialog = (person: AdminPersonRow) => {
    setFeedback(null);
    setSelectedPerson(person);
    setDraftRole(person.role ?? "client");
    setDraftStatus(person.status);
    setDraftBusinessBoards(
      person.role === "salesman" && person.salesman_business_boards.length > 0
        ? person.salesman_business_boards
        : ["tourism"],
    );
    customerTypeEditor.openCustomerTypeDraft(person);
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
      if (value === "salesman" && draftBusinessBoards.length === 0) {
        setDraftBusinessBoards(["tourism"]);
      }
    }
  };

  const handleDraftBusinessBoardChange = (
    board: SalesmanBusinessBoard,
    checked: boolean,
  ) => {
    setDraftBusinessBoards((currentBoards) => {
      const nextBoards = checked
        ? [...currentBoards, board]
        : currentBoards.filter((currentBoard) => currentBoard !== board);

      return uniqueSalesmanBusinessBoards(nextBoards);
    });
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
      let latestPerson = selectedPerson;
      let savedAccountChange = false;
      let savedCustomerType = false;

      if (accountWillChange || businessAccessWillChange) {
        const response = await fetch("/api/admin/people/account", {
          body: JSON.stringify({
            targetUserId: selectedPerson.user_id,
            nextRole: draftRole,
            nextStatus: draftStatus,
            salesmanBusinessBoards:
              draftRole === "salesman" ? draftBusinessBoards : [],
            note: draftNote,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const result = await readAdminPeopleUpdateResponse(response);

        if (!response.ok) {
          setFeedback({
            tone: "error",
            message: t(`errors.${normalizeAdminPeopleErrorCode(result.error)}`),
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

        latestPerson = result.person;
        savedAccountChange = true;

        setPeople((currentPeople) =>
          currentPeople.map((person) =>
            person.user_id === result.person?.user_id ? result.person : person,
          ),
        );

        if (result.recentChanges) {
          setRecentChanges(result.recentChanges);
        }
      }

      if (customerTypeWillChange) {
        const updatedPerson =
          await customerTypeEditor.saveCustomerTypeChange(latestPerson);

        if (!updatedPerson) {
          return;
        }

        latestPerson = updatedPerson;
        savedCustomerType = true;
      }

      setSelectedPerson(null);
      setFeedback({
        tone: "success",
        message: savedAccountChange
          ? t("feedback.saved")
          : savedCustomerType
            ? t("feedback.customerTypeSaved")
            : t("feedback.saved"),
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
    businessBoardLabels,
    businessBoardOptions: SALESMAN_BUSINESS_BOARD_OPTIONS,
    customerTypeWillChange,
    customerTypeLabels: customerTypeEditor.customerTypeLabels,
    customerTypeOptions: customerTypeEditor.customerTypeOptions,
    draftCustomerType: customerTypeEditor.draftCustomerType,
    draftBusinessBoards,
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
    handleDraftCustomerTypeChange:
      customerTypeEditor.handleDraftCustomerTypeChange,
    handleDraftBusinessBoardChange,
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

function isDraftBusinessAccessChanged(
  selectedPerson: AdminPersonRow,
  draftRole: AdminPeopleRole,
  draftBusinessBoards: SalesmanBusinessBoard[],
) {
  if (selectedPerson.role !== "salesman" && draftRole !== "salesman") {
    return false;
  }

  const currentBoards =
    selectedPerson.role === "salesman" ? selectedPerson.salesman_business_boards : [];
  const nextBoards = draftRole === "salesman" ? draftBusinessBoards : [];

  return !areSalesmanBusinessBoardsEqual(currentBoards, nextBoards);
}
