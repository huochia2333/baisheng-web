"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  ADMIN_PEOPLE_CITY_MAX_LENGTH,
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
  uniqueSalesmanBusinessBoards,
  type SalesmanBusinessBoard,
  type SalesmanBusinessBoardLabels,
} from "@/lib/salesman-business-access";
import { isSalesStaffRole } from "@/lib/sales-staff-roles";
import { usePersonPrivateNoteEditor } from "@/components/dashboard/person-notes/use-person-private-note-editor";

import {
  getPersonDisplayName,
  personMatchesSearch,
  type AdminPeopleRoleLabels,
  type AdminPeopleStatusLabels,
} from "./admin-people-display";
import {
  isDraftBusinessAccessChanged,
  normalizeAdminPeopleErrorCode,
  readAdminPeopleUpdateResponse,
  type AdminPeopleFeedback,
} from "./admin-people-view-model-utils";
import { useAdminCustomerTypeMark } from "./use-admin-customer-type-mark";
import { useAdminPeopleVipActions } from "./use-admin-people-vip-actions";

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
  const [selectedPerson, setSelectedPerson] = useState<AdminPersonRow | null>(
    null,
  );
  const [draftRole, setDraftRole] = useState<AdminPeopleRole>("client");
  const [draftStatus, setDraftStatus] = useState<AdminPeopleStatus>("inactive");
  const [draftCity, setDraftCity] = useState("");
  const [draftBusinessBoards, setDraftBusinessBoards] = useState<
    SalesmanBusinessBoard[]
  >(["tourism"]);
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { handleVipRequestAction, vipActionPendingId } =
    useAdminPeopleVipActions({
      setFeedback,
      setPeople,
    });

  const roleLabels = useMemo<AdminPeopleRoleLabels>(
    () => ({
      administrator: t("roles.administrator"),
      client: t("roles.client"),
      finance: t("roles.finance"),
      manager: t("roles.manager"),
      operator: t("roles.operator"),
      promoter: t("roles.promoter"),
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
  const personNoteEditor = usePersonPrivateNoteEditor<AdminPersonRow>({
    getTargetName: (person) =>
      getPersonDisplayName(person, t("fallback.unnamedUser")),
    onSaved: (targetUserId, privateNote) => {
      setPeople((currentPeople) =>
        currentPeople.map((person) =>
          person.user_id === targetUserId
            ? { ...person, private_note: privateNote }
            : person,
        ),
      );
    },
    setFeedback,
  });
  const businessBoardOptions =
    draftRole === "promoter"
      ? (["tourism"] as const)
      : SALESMAN_BUSINESS_BOARD_OPTIONS;

  const summary = useMemo(() => {
    const activeCount = people.filter(
      (person) => person.status === "active",
    ).length;
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
    (selectedPerson.role !== draftRole ||
      selectedPerson.status !== draftStatus);
  const cityWillChange =
    selectedPerson !== null &&
    (selectedPerson.city ?? "").trim() !== draftCity.trim();
  const businessAccessWillChange =
    selectedPerson !== null &&
    isDraftBusinessAccessChanged(
      selectedPerson,
      draftRole,
      draftBusinessBoards,
    );
  const customerTypeWillChange = customerTypeEditor.customerTypeWillChange(
    selectedPerson,
    draftRole,
  );
  const hasDraftChange =
    accountWillChange ||
    cityWillChange ||
    businessAccessWillChange ||
    customerTypeWillChange;
  const canSaveDraft =
    dialogOpen && hasDraftChange && !selectedPersonIsCurrentViewer && !saving;

  const openAccountDialog = (person: AdminPersonRow) => {
    setFeedback(null);
    setSelectedPerson(person);
    setDraftRole(person.role ?? "client");
    setDraftStatus(person.status);
    setDraftCity(person.city ?? "");
    setDraftBusinessBoards(
      person.role === "promoter"
        ? ["tourism"]
        : isSalesStaffRole(person.role) && person.salesman_business_boards.length > 0
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
      if (value === "promoter") {
        setDraftBusinessBoards(["tourism"]);
        return;
      }

      if (value === "salesman" && draftBusinessBoards.length === 0) {
        setDraftBusinessBoards(["tourism"]);
      }
    }
  };

  const handleDraftCityChange = (value: string) => {
    setDraftCity(value.slice(0, ADMIN_PEOPLE_CITY_MAX_LENGTH));
  };

  const handleDraftBusinessBoardChange = (
    board: SalesmanBusinessBoard,
    checked: boolean,
  ) => {
    if (draftRole === "promoter") {
      setDraftBusinessBoards(["tourism"]);
      return;
    }

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
    setStatusFilter(
      value === "all" || isAdminPeopleStatus(value) ? value : "all",
    );
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

      if (accountWillChange || cityWillChange || businessAccessWillChange) {
        const response = await fetch("/api/admin/people/account", {
          body: JSON.stringify({
            targetUserId: selectedPerson.user_id,
            nextRole: draftRole,
            nextStatus: draftStatus,
            nextCity: draftCity,
            salesmanBusinessBoards:
              isSalesStaffRole(draftRole) ? draftBusinessBoards : [],
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
    businessAccessLocked: draftRole === "promoter",
    businessBoardOptions,
    customerTypeWillChange,
    customerTypeLabels: customerTypeEditor.customerTypeLabels,
    customerTypeOptions: customerTypeEditor.customerTypeOptions,
    draftCustomerType: customerTypeEditor.draftCustomerType,
    draftBusinessBoards,
    draftCity,
    draftNote,
    draftRole,
    draftStatus,
    feedback,
    filteredPeople,
    hasPermission: initialData.hasPermission,
    people,
    personNoteEditor,
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
    vipActionPendingId,
    closeAccountDialog,
    handleDraftCustomerTypeChange:
      customerTypeEditor.handleDraftCustomerTypeChange,
    handleDraftBusinessBoardChange,
    handleDraftCityChange,
    handleDraftRoleChange,
    handleDraftStatusChange,
    handleRoleFilterChange,
    handleSaveAccountChange,
    handleStatusFilterChange,
    handleVipRequestAction,
    openAccountDialog,
    setDraftNote,
    setSearchText,
  };
}
