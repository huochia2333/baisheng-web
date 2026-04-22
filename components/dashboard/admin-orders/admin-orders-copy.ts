type TranslationValues = Record<string, string | number>;
type OrdersUiTranslator = (key: string, values?: TranslationValues) => string;

export const PURCHASE_SUBTYPE_KEYS = {
  dropshipping: "subtypes.purchase.dropshipping",
  group_buying: "subtypes.purchase.groupBuying",
  sourcing: "subtypes.purchase.sourcing",
  tourist_shopping: "subtypes.purchase.touristShopping",
} as const;

export const SERVICE_SUBTYPE_KEYS = {
  airport_transfer: "subtypes.service.airportTransfer",
  car_service: "subtypes.service.carService",
  digital_survival: "subtypes.service.digitalSurvival",
  medical_escort: "subtypes.service.medicalEscort",
  tour_escort: "subtypes.service.tourEscort",
  vip_recharge: "subtypes.service.vipRecharge",
} as const;

type OrderFieldKey =
  | "amount"
  | "costAmount"
  | "dailyExchangeRate"
  | "orderEntryUser"
  | "orderStatus"
  | "orderType"
  | "orderingUser"
  | "originalCurrency"
  | "purchaseDetails"
  | "purchaseSubtype"
  | "rmbAmount"
  | "serviceDetails"
  | "serviceDiscount"
  | "serviceSubtype"
  | "transactionRate";

export type OrdersUiCopy = {
  categories: {
    purchase: string;
    service: string;
  };
  errors: {
    cannotCreate: string;
    cannotDelete: string;
    cannotUpdate: string;
    duplicateOrderNumber: string;
    inactiveOrderNumber: string;
    invalidForeignKeys: string;
    orderNotFound: string;
    updatedScopeNotAllowed: string;
  };
  fallback: {
    formContent: string;
    item: (index: number) => string;
    no: string;
    notProvided: string;
    yes: string;
  };
  fields: Record<OrderFieldKey, string>;
  status: {
    cancelled: string;
    completed: string;
    inProgress: string;
    notProvided: string;
    pending: string;
    refunding: string;
    settled: string;
  };
  subtypes: {
    purchase: Record<keyof typeof PURCHASE_SUBTYPE_KEYS, string>;
    service: Record<keyof typeof SERVICE_SUBTYPE_KEYS, string>;
  };
  validation: {
    inputPrompt: (label: string) => string;
    invalidDetails: (label: string) => string;
    invalidFormat: (label: string) => string;
    minZero: (label: string) => string;
    selectPrompt: (label: string) => string;
  };
};

export function createOrdersUiCopy(t: OrdersUiTranslator): OrdersUiCopy {
  return {
    categories: {
      purchase: t("categories.purchase"),
      service: t("categories.service"),
    },
    errors: {
      cannotCreate: t("errors.cannotCreate"),
      cannotDelete: t("errors.cannotDelete"),
      cannotUpdate: t("errors.cannotUpdate"),
      duplicateOrderNumber: t("errors.duplicateOrderNumber"),
      inactiveOrderNumber: t("errors.inactiveOrderNumber"),
      invalidForeignKeys: t("errors.invalidForeignKeys"),
      orderNotFound: t("errors.orderNotFound"),
      updatedScopeNotAllowed: t("errors.updatedScopeNotAllowed"),
    },
    fallback: {
      formContent: t("fallback.formContent"),
      item: (index) => t("fallback.item", { index }),
      no: t("fallback.no"),
      notProvided: t("status.notProvided"),
      yes: t("fallback.yes"),
    },
    fields: {
      amount: t("fields.amount"),
      costAmount: t("fields.costAmount"),
      dailyExchangeRate: t("fields.dailyExchangeRate"),
      orderEntryUser: t("fields.orderEntryUser"),
      orderStatus: t("fields.orderStatus"),
      orderType: t("fields.orderType"),
      orderingUser: t("fields.orderingUser"),
      originalCurrency: t("fields.originalCurrency"),
      purchaseDetails: t("fields.purchaseDetails"),
      purchaseSubtype: t("fields.purchaseSubtype"),
      rmbAmount: t("fields.rmbAmount"),
      serviceDetails: t("fields.serviceDetails"),
      serviceDiscount: t("fields.serviceDiscount"),
      serviceSubtype: t("fields.serviceSubtype"),
      transactionRate: t("fields.transactionRate"),
    },
    status: {
      cancelled: t("status.cancelled"),
      completed: t("status.completed"),
      inProgress: t("status.inProgress"),
      notProvided: t("status.notProvided"),
      pending: t("status.pending"),
      refunding: t("status.refunding"),
      settled: t("status.settled"),
    },
    subtypes: {
      purchase: {
        dropshipping: t("subtypes.purchase.dropshipping"),
        group_buying: t("subtypes.purchase.groupBuying"),
        sourcing: t("subtypes.purchase.sourcing"),
        tourist_shopping: t("subtypes.purchase.touristShopping"),
      },
      service: {
        airport_transfer: t("subtypes.service.airportTransfer"),
        car_service: t("subtypes.service.carService"),
        digital_survival: t("subtypes.service.digitalSurvival"),
        medical_escort: t("subtypes.service.medicalEscort"),
        tour_escort: t("subtypes.service.tourEscort"),
        vip_recharge: t("subtypes.service.vipRecharge"),
      },
    },
    validation: {
      inputPrompt: (label) => t("validation.inputPrompt", { label }),
      invalidDetails: (label) => t("validation.invalidDetails", { label }),
      invalidFormat: (label) => t("validation.invalidFormat", { label }),
      minZero: (label) => t("validation.minZero", { label }),
      selectPrompt: (label) => t("validation.selectPrompt", { label }),
    },
  };
}
