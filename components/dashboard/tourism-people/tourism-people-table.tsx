"use client";

import { UsersRound } from "lucide-react";

import {
  DashboardTableFrame,
} from "@/components/dashboard/dashboard-section-panel";
import { EmptyState } from "@/components/dashboard/dashboard-shared-ui";
import type { AdminPersonRow } from "@/lib/admin-people";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import {
  formatTourismPeopleDate,
  getTourismPersonContact,
  getTourismPersonName,
  getTourismRoleLabel,
  TOURISM_STATUS_LABELS,
  type TourismPeopleTab,
} from "./tourism-people-display";

type TourismPeopleTableProps = {
  locale: Locale;
  onSelect: (person: AdminPersonRow) => void;
  people: AdminPersonRow[];
  tab: TourismPeopleTab;
};

export function TourismPeopleTable({
  locale,
  onSelect,
  people,
  tab,
}: TourismPeopleTableProps) {
  if (people.length === 0) {
    return (
      <EmptyState
        description="没有匹配的人员。可以调整搜索或筛选条件后再查看。"
        icon={<UsersRound className="size-5" />}
        title="暂无匹配人员"
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <DashboardTableFrame>
          <table className="w-full min-w-[860px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
              <tr>
                <th className="px-3 py-3">人员</th>
                <th className="px-3 py-3">账号状态</th>
                <th className="px-3 py-3">推荐信息</th>
                <th className="px-3 py-3">城市</th>
                <th className="px-3 py-3">注册时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9e1]">
              {people.map((person) => (
                <tr
                  className="cursor-pointer align-top transition-colors hover:bg-[#fcfbf8]"
                  key={person.user_id}
                  onClick={() => onSelect(person)}
                >
                  <td className="px-3 py-4">
                    <p className="break-words font-semibold text-[#23313a] [overflow-wrap:anywhere]">
                      {getTourismPersonName(person)}
                    </p>
                    <p className="mt-1 break-all text-xs text-[#7b858d]">
                      {getTourismPersonContact(person)}
                    </p>
                    <RoleChip>{getTourismRoleLabel(tab)}</RoleChip>
                  </td>
                  <td className="px-3 py-4">
                    <StatusChip status={person.status} />
                  </td>
                  <td className="px-3 py-4 text-[#53616d]">
                    <p>邀请码：{person.referral_code ?? "待补充"}</p>
                    <p className="mt-1 text-xs text-[#7b858d]">
                      推荐人：{person.referrer_name ?? person.referrer_email ?? "无"}
                    </p>
                    <p className="mt-1 text-xs text-[#7b858d]">
                      直接推荐 {person.direct_referral_count} 人
                    </p>
                  </td>
                  <td className="px-3 py-4 text-[#53616d]">
                    {person.city ?? "待补充"}
                  </td>
                  <td className="px-3 py-4 text-[#53616d]">
                    {formatTourismPeopleDate(person.created_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardTableFrame>
      </div>
      <div className="grid gap-3 md:hidden">
        {people.map((person) => (
          <button
            className="rounded-[18px] border border-[#ebe7e1] bg-white p-4 text-left shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
            key={person.user_id}
            onClick={() => onSelect(person)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-[#23313a]">
                  {getTourismPersonName(person)}
                </p>
                <p className="mt-1 break-all text-sm text-[#6f7b85]">
                  {getTourismPersonContact(person)}
                </p>
              </div>
              <StatusChip status={person.status} />
            </div>
            <p className="mt-3 text-sm text-[#6f7b85]">
              邀请码：{person.referral_code ?? "待补充"}
            </p>
            <p className="mt-1 text-sm text-[#6f7b85]">
              推荐人：{person.referrer_name ?? person.referrer_email ?? "无"}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}

function RoleChip({ children }: { children: string }) {
  return (
    <span className="mt-2 inline-flex rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: AdminPersonRow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        status === "active" && "bg-[#e8f4ec] text-[#4c7259]",
        status === "inactive" && "bg-[#fff5db] text-[#9a6a07]",
        status === "suspended" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {TOURISM_STATUS_LABELS[status]}
    </span>
  );
}
