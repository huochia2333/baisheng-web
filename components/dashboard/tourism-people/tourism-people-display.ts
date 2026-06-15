"use client";

import type { AdminPersonRow } from "@/lib/admin-people";
import type { Locale } from "@/lib/locale";

export type TourismPeopleTab = "customers" | "promoters";

export const TOURISM_STATUS_LABELS = {
  active: "正常",
  inactive: "未启用",
  suspended: "已停用",
} as const;

export function isTourismCustomer(person: AdminPersonRow) {
  return (
    person.role === "client" &&
    person.workspace_business_access.includes("tourism")
  );
}

export function isTourismPromoter(person: AdminPersonRow) {
  return person.role === "promoter";
}

export function getTourismPersonName(person: AdminPersonRow) {
  return person.name?.trim() || person.email?.trim() || "未命名账号";
}

export function getTourismPersonContact(person: AdminPersonRow) {
  return [person.email, person.phone].filter(Boolean).join(" / ") || "未填写联系方式";
}

export function getTourismRoleLabel(tab: TourismPeopleTab) {
  return tab === "customers" ? "旅游客户" : "地推";
}

export function formatTourismPeopleDate(
  value: string | null,
  locale: Locale,
  fallback = "待补充",
) {
  if (!value) return fallback;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}
