"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  SALESMAN_CUSTOMER_TYPE_OPTIONS,
  isSalesmanCustomerType,
  type SalesmanCustomerRow,
  type SalesmanCustomerType,
  type SalesmanPeoplePageData,
} from "@/lib/salesman-people";

import {
  salesmanCustomerMatchesSearch,
  type SalesmanCustomerTypeLabels,
} from "./salesman-people-display";

type Feedback = {
  tone: "error" | "success" | "info";
  message: string;
};

type UpdateResponse = {
  customer?: SalesmanCustomerRow;
  error?: string;
};

export function useSalesmanPeopleViewModel({
  initialData,
}: {
  initialData: SalesmanPeoplePageData;
}) {
  const t = useTranslations("SalesmanPeople");
  const [customers, setCustomers] = useState(initialData.customers);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<SalesmanCustomerRow | null>(null);
  const [draftType, setDraftType] = useState<SalesmanCustomerType | "">("");
  const [saving, setSaving] = useState(false);

  const customerTypeLabels = useMemo<SalesmanCustomerTypeLabels>(
    () => ({
      retail: t("customerTypes.retail"),
      wholesale: t("customerTypes.wholesale"),
    }),
    [t],
  );

  const summary = useMemo(() => {
    const retailCount = customers.filter(
      (customer) => customer.customer_type === "retail",
    ).length;
    const wholesaleCount = customers.filter(
      (customer) => customer.customer_type === "wholesale",
    ).length;

    return {
      retailCount,
      totalCount: customers.length,
      unmarkedCount: customers.length - retailCount - wholesaleCount,
      wholesaleCount,
    };
  }, [customers]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        salesmanCustomerMatchesSearch(customer, searchText),
      ),
    [customers, searchText],
  );

  const dialogOpen = selectedCustomer !== null;
  const canSaveDraft =
    selectedCustomer !== null &&
    !saving &&
    isSalesmanCustomerType(draftType) &&
    selectedCustomer.customer_type !== draftType;

  const openCustomerTypeDialog = (customer: SalesmanCustomerRow) => {
    setFeedback(null);
    setSelectedCustomer(customer);
    setDraftType(customer.customer_type ?? "");
  };

  const closeCustomerTypeDialog = () => {
    if (saving) {
      return;
    }

    setSelectedCustomer(null);
  };

  const handleDraftTypeChange = (value: string) => {
    if (value === "") {
      setDraftType("");
      return;
    }

    if (!isSalesmanCustomerType(value)) {
      return;
    }

    setDraftType(value);
  };

  const handleSaveCustomerType = async () => {
    if (!selectedCustomer || !isSalesmanCustomerType(draftType) || !canSaveDraft) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/salesman/people/customer-type", {
        body: JSON.stringify({
          customerType: draftType,
          customerUserId: selectedCustomer.user_id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = await readUpdateResponse(response);

      if (!response.ok || !result.customer) {
        setFeedback({
          tone: "error",
          message: t(`errors.${normalizeErrorCode(result.error)}`),
        });
        return;
      }

      const updatedCustomer = result.customer;

      setCustomers((currentCustomers) =>
        currentCustomers.map((item) =>
          item.user_id === updatedCustomer.user_id ? updatedCustomer : item,
        ),
      );
      setSelectedCustomer(null);
      setDraftType(updatedCustomer.customer_type ?? draftType);
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
    customerTypeLabels,
    customerTypeOptions: SALESMAN_CUSTOMER_TYPE_OPTIONS,
    dialogOpen,
    draftType,
    feedback,
    filteredCustomers,
    hasPermission: initialData.hasPermission,
    saving,
    searchText,
    selectedCustomer,
    summary,
    closeCustomerTypeDialog,
    handleDraftTypeChange,
    handleSaveCustomerType,
    openCustomerTypeDialog,
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
      customer: isSalesmanCustomerRow(value.customer)
        ? value.customer
        : undefined,
      error: typeof value.error === "string" ? value.error : undefined,
    };
  } catch {
    return {};
  }
}

function normalizeErrorCode(value: string | undefined) {
  switch (value) {
    case "forbidden":
    case "invalidInput":
    case "notFound":
    case "serviceUnavailable":
      return value;
    default:
      return "unknown";
  }
}

function isSalesmanCustomerRow(value: unknown): value is SalesmanCustomerRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.user_id === "string" &&
    typeof value.created_at === "string" &&
    (value.customer_type === null || isSalesmanCustomerType(value.customer_type))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
