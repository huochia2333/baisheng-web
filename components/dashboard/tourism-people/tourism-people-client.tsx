"use client";

import { useMemo, useState } from "react";

import { RefreshCcw, Search, UserCheck, UsersRound } from "lucide-react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import {
  DashboardFilterField,
  DashboardFilterPanel,
  DashboardListSection,
  dashboardFilterInputClassName,
} from "@/components/dashboard/dashboard-section-panel";
import { DashboardSegmentedTabs } from "@/components/dashboard/dashboard-segmented-tabs";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-section-header";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { AdminPeoplePageData, AdminPersonRow } from "@/lib/admin-people";
import type { Locale } from "@/lib/locale";
import { normalizeSearchText } from "@/lib/value-normalizers";
import { cn } from "@/lib/utils";

import {
  formatTourismPeopleDate,
  getTourismPersonContact,
  getTourismPersonName,
  isTourismCustomer,
  isTourismPromoter,
  TOURISM_STATUS_LABELS,
  type TourismPeopleTab,
} from "./tourism-people-display";
import { TourismPeopleTable } from "./tourism-people-table";

const ALL = "all";

export function TourismPeopleClient({
  initialData,
}: {
  initialData: AdminPeoplePageData;
}) {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<TourismPeopleTab>("customers");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [selectedPerson, setSelectedPerson] = useState<AdminPersonRow | null>(
    null,
  );

  const tourismCustomers = useMemo(
    () => initialData.people.filter(isTourismCustomer),
    [initialData.people],
  );
  const promoters = useMemo(
    () => initialData.people.filter(isTourismPromoter),
    [initialData.people],
  );
  const visiblePeople = activeTab === "customers" ? tourismCustomers : promoters;
  const filteredPeople = useMemo(() => {
    const searchValue = normalizeSearchText(searchText);

    return visiblePeople.filter((person) => {
      if (statusFilter !== ALL && person.status !== statusFilter) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return [
        person.name ?? "",
        person.email ?? "",
        person.phone ?? "",
        person.city ?? "",
        person.referral_code ?? "",
        person.referrer_name ?? "",
        person.referrer_email ?? "",
        person.team_name ?? "",
      ].some((value) => normalizeSearchText(value).includes(searchValue));
    });
  }, [searchText, statusFilter, visiblePeople]);
  const hasFilters = searchText || statusFilter !== ALL;
  const activeCount = visiblePeople.filter(
    (person) => person.status === "active",
  ).length;

  if (!initialData.hasPermission) {
    return (
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
        <DashboardListSection
          description="只有正常启用的管理员账号可以查看旅游人员。"
          title="没有旅游人员管理权限"
        >
          <EmptyState
            description="请使用正常启用的管理员账号查看旅游人员。"
            icon={<UsersRound className="size-5" />}
            title="暂无权限"
          />
        </DashboardListSection>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
      <DashboardSectionHeader
        badge="旅游业务"
        badgeIcon={<UsersRound className="size-4" />}
        description="这里查看旅游客户和地推账户。登录账号的身份、状态和城市调整统一在全局账号管理中处理。"
        metrics={[
          {
            accent: "blue",
            icon: <UsersRound className="size-5" />,
            label: "旅游客户",
            value: tourismCustomers.length,
          },
          {
            accent: "green",
            icon: <UserCheck className="size-5" />,
            label: "地推账户",
            value: promoters.length,
          },
          {
            accent: "blue",
            icon: <UserCheck className="size-5" />,
            label: "当前正常",
            value: activeCount,
          },
        ]}
        metricsClassName="grid-cols-1 sm:grid-cols-3"
        metricsPlacement="below"
        title="旅游人员管理"
      />

      <DashboardSegmentedTabs
        onChange={setActiveTab}
        options={[
          {
            badge: tourismCustomers.length,
            icon: <UsersRound className="size-4" />,
            key: "customers",
            label: "旅游客户",
          },
          {
            badge: promoters.length,
            icon: <UserCheck className="size-4" />,
            key: "promoters",
            label: "地推账户",
          },
        ]}
        value={activeTab}
      />

      <DashboardListSection
        actions={
          <Button
            className="rounded-full border border-[#d8dde2] bg-white text-[#486782] hover:bg-[#eef3f6]"
            disabled={!hasFilters}
            onClick={() => {
              setSearchText("");
              setStatusFilter(ALL);
            }}
            type="button"
            variant="outline"
          >
            <RefreshCcw className="size-4" />
            清空筛选
          </Button>
        }
        description={`共 ${visiblePeople.length} 人，当前显示 ${filteredPeople.length} 人。`}
        title={activeTab === "customers" ? "旅游客户" : "地推账户"}
      >
        <DashboardFilterPanel gridClassName="sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <DashboardFilterField label="搜索人员">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a949c]" />
              <input
                className={cn(dashboardFilterInputClassName, "pl-10")}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="姓名、手机号、邮箱、城市或推荐码"
                type="search"
                value={searchText}
              />
            </div>
          </DashboardFilterField>
          <DashboardFilterField label="账号状态">
            <select
              className={dashboardFilterInputClassName}
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value={ALL}>全部状态</option>
              <option value="active">正常</option>
              <option value="inactive">未启用</option>
              <option value="suspended">已停用</option>
            </select>
          </DashboardFilterField>
        </DashboardFilterPanel>

        <div className="mt-5">
          <TourismPeopleTable
            locale={locale}
            onSelect={setSelectedPerson}
            people={filteredPeople}
            tab={activeTab}
          />
        </div>
      </DashboardListSection>

      <DashboardDialog
        onOpenChange={(open) => {
          if (!open) setSelectedPerson(null);
        }}
        open={Boolean(selectedPerson)}
        title={selectedPerson ? getTourismPersonName(selectedPerson) : "人员详情"}
      >
        {selectedPerson ? (
          <TourismPersonDetails locale={locale} person={selectedPerson} />
        ) : null}
      </DashboardDialog>
    </section>
  );
}

function TourismPersonDetails({
  locale,
  person,
}: {
  locale: Locale;
  person: AdminPersonRow;
}) {
  const rows = [
    { label: "联系方式", value: getTourismPersonContact(person) },
    { label: "账号状态", value: TOURISM_STATUS_LABELS[person.status] },
    { label: "城市", value: person.city ?? "待补充" },
    { label: "邀请码", value: person.referral_code ?? "待补充" },
    {
      label: "推荐人",
      value: person.referrer_name ?? person.referrer_email ?? "无",
    },
    {
      label: "团队",
      value: person.team_name ?? "未加入团队",
    },
    {
      label: "直接推荐",
      value: `${person.direct_referral_count} 人`,
    },
    {
      label: "注册时间",
      value: formatTourismPeopleDate(person.created_at, locale),
    },
    {
      label: "最近调整",
      value: formatTourismPeopleDate(person.latest_change_at, locale),
    },
  ];

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div
          className="min-w-0 rounded-[18px] border border-[#e4e9ed] bg-white px-4 py-3"
          key={row.label}
        >
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#88939b] uppercase">
            {row.label}
          </p>
          <p className="mt-1 break-words text-sm leading-6 text-[#53616d] [overflow-wrap:anywhere]">
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}
