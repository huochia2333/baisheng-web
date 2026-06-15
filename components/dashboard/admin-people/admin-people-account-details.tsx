"use client";

import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

import type { AdminPersonRow } from "@/lib/admin-people";
import type { Locale } from "@/lib/locale";

import {
  formatPeopleDate,
  getCustomerTypeLabel,
  getPersonRelationSummary,
  getRoleLabel,
  getStatusLabel,
  getWorkspaceBusinessAccessLabel,
} from "./admin-people-display";
import type { useAdminPeopleViewModel } from "./use-admin-people-view-model";

type AdminPeopleViewModel = ReturnType<typeof useAdminPeopleViewModel>;

type AccountDetailItem = {
  label: string;
  value: ReactNode;
};

export function AdminPeopleAccountDetails({
  businessBoardLabels,
  customerTypeLabels,
  locale,
  person,
  roleLabels,
  statusLabels,
}: {
  businessBoardLabels: AdminPeopleViewModel["businessBoardLabels"];
  customerTypeLabels: AdminPeopleViewModel["customerTypeLabels"];
  locale: Locale;
  person: AdminPersonRow;
  roleLabels: AdminPeopleViewModel["roleLabels"];
  statusLabels: AdminPeopleViewModel["statusLabels"];
}) {
  const t = useTranslations("AdminPeople");
  const fallback = t("fallback.notProvided");
  const relation = getPersonRelationSummary(person, {
    noReferrer: t("fallback.noReferrer"),
    noTeam: t("fallback.noTeam"),
  });
  const businessAccess = getWorkspaceBusinessAccessLabel(
    person.workspace_business_access,
    businessBoardLabels,
    t("details.noBusinessAccess"),
  );

  return (
    <div className="min-w-0 space-y-4">
      <DetailSection
        items={[
          {
            label: t("details.email"),
            value: person.email ?? fallback,
          },
          {
            label: t("details.phone"),
            value: person.phone ?? fallback,
          },
          {
            label: t("details.role"),
            value: getRoleLabel(person.role, roleLabels, fallback),
          },
          {
            label: t("details.status"),
            value: getStatusLabel(person.status, statusLabels, fallback),
          },
          {
            label: t("details.city"),
            value: person.city ?? fallback,
          },
          {
            label: t("details.createdAt"),
            value: formatPeopleDate(person.created_at, locale, fallback),
          },
        ]}
        title={t("details.basicTitle")}
      />

      <DetailSection
        items={[
          {
            label: t("details.customerType"),
            value: getCustomerTypeLabel(
              person.customer_type,
              customerTypeLabels,
              fallback,
            ),
          },
          {
            label: t("details.customerTypeMarkedBy"),
            value: person.customer_type_marked_by_name ?? fallback,
          },
          {
            label: t("details.customerTypeMarkedAt"),
            value: formatPeopleDate(
              person.customer_type_marked_at,
              locale,
              fallback,
            ),
          },
          {
            label: t("details.businessAccess"),
            value: businessAccess,
          },
          {
            label: t("details.referralCode"),
            value: person.referral_code ?? fallback,
          },
          {
            label: t("details.referrer"),
            value: relation.referrer,
          },
          {
            label: t("details.team"),
            value: relation.team,
          },
          {
            label: t("details.directReferrals"),
            value: t("details.directReferralsValue", {
              count: person.direct_referral_count,
            }),
          },
          {
            label: t("details.latestChangeAt"),
            value: formatPeopleDate(person.latest_change_at, locale, fallback),
          },
        ]}
        title={t("details.businessTitle")}
      />

      <section>
        <p className="text-sm font-semibold text-[#23313a]">
          {t("details.noteTitle")}
        </p>
      <div className="mt-3 min-w-0 rounded-[18px] border border-[#e4e9ed] bg-white px-4 py-3 text-sm leading-6 text-[#53616d]">
          <p className="break-words [overflow-wrap:anywhere]">
            {person.private_note ?? t("fallback.noPrivateNote")}
          </p>
        </div>
      </section>
    </div>
  );
}

function DetailSection({
  items,
  title,
}: {
  items: AccountDetailItem[];
  title: string;
}) {
  return (
    <section className="min-w-0">
      <p className="text-sm font-semibold text-[#23313a]">{title}</p>
      <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <DetailItem item={item} key={item.label} />
        ))}
      </div>
    </section>
  );
}

function DetailItem({ item }: { item: AccountDetailItem }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[#e4e9ed] bg-white px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
        {item.label}
      </p>
      <p className="mt-1 break-words text-sm leading-6 text-[#53616d] [overflow-wrap:anywhere]">
        {item.value}
      </p>
    </div>
  );
}
