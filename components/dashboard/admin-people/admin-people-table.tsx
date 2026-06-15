"use client";

import { StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardTableFrame } from "@/components/dashboard/dashboard-section-panel";
import { Button } from "@/components/ui/button";
import type { AdminPersonRow } from "@/lib/admin-people";
import { cn } from "@/lib/utils";

import {
  getPersonContact,
  getPersonDisplayName,
  getRoleLabel,
} from "./admin-people-display";
import type { useAdminPeopleViewModel } from "./use-admin-people-view-model";

type AdminPeopleViewModel = ReturnType<typeof useAdminPeopleViewModel>;

export function PeopleTable({
  currentViewerId,
  onAdjustPerson,
  onEditPersonNote,
  people,
  roleLabels,
  statusLabels,
}: {
  currentViewerId: string | null;
  onAdjustPerson: (person: AdminPersonRow) => void;
  onEditPersonNote: (person: AdminPersonRow) => void;
  people: AdminPersonRow[];
  roleLabels: AdminPeopleViewModel["roleLabels"];
  statusLabels: AdminPeopleViewModel["statusLabels"];
}) {
  const t = useTranslations("AdminPeople");
  const fallback = t("fallback.notProvided");

  return (
    <>
      <div className="hidden md:block">
        <DashboardTableFrame>
          <table className="w-full min-w-[860px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[32%]" />
          <col className="w-[20%]" />
          <col className="w-[16%]" />
          <col className="w-[20%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="bg-[#f6f4f0] text-xs font-semibold text-[#66727d]">
          <tr>
            <th className="px-3 py-3">{t("directory.columns.account")}</th>
            <th className="px-3 py-3">{t("directory.columns.accountState")}</th>
            <th className="px-3 py-3">{t("directory.columns.city")}</th>
            <th className="px-3 py-3">{t("directory.columns.privateNote")}</th>
            <th className="px-3 py-3">{t("directory.columns.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eee9e1]">
          {people.map((person) => {
            const isCurrentViewer = person.user_id === currentViewerId;
            const displayName = getPersonDisplayName(
              person,
              t("fallback.unnamedUser"),
            );

            return (
              <tr key={person.user_id} className="align-top">
                <td className="px-3 py-4">
                  <button
                    aria-label={t("actions.openDetailsFor", {
                      name: displayName,
                    })}
                    className="block min-w-0 text-left"
                    onClick={() => onAdjustPerson(person)}
                    type="button"
                  >
                    <span className="block break-words font-semibold text-[#23313a] underline-offset-4 [overflow-wrap:anywhere] hover:text-[#486782] hover:underline">
                      {displayName}
                    </span>
                    <span className="mt-1 block break-all text-xs text-[#7b858d]">
                      {getPersonContact(person, fallback)}
                    </span>
                  </button>
                </td>
                <td className="px-3 py-4">
                  <div className="flex min-w-0 flex-col items-start gap-2">
                    <span className="inline-flex rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
                      {getRoleLabel(person.role, roleLabels, fallback)}
                    </span>
                    <StatusChip
                      label={statusLabels[person.status]}
                      status={person.status}
                    />
                  </div>
                </td>
                <td className="px-3 py-4 text-[#53616d]">
                  {person.city ?? fallback}
                </td>
                <td className="px-3 py-4 text-[#53616d]">
                  <p className="line-clamp-3 break-words">
                    {person.private_note ?? t("fallback.noPrivateNote")}
                  </p>
                </td>
                <td className="px-3 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <Button
                      className="h-9 rounded-full border border-[#d9e0e5] bg-white px-3 text-[#486782] hover:bg-[#f3f6f8]"
                      onClick={() => onEditPersonNote(person)}
                    >
                      <StickyNote className="size-4" />
                      {t("actions.note")}
                    </Button>
                    <Button
                      className="h-9 rounded-full bg-[#486782] px-3 text-white hover:bg-[#3e5f79] disabled:bg-[#d9dee2] disabled:text-[#7c8790]"
                      disabled={isCurrentViewer}
                      onClick={() => onAdjustPerson(person)}
                    >
                      {isCurrentViewer
                        ? t("actions.currentAccount")
                        : t("actions.adjust")}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
          </table>
        </DashboardTableFrame>
      </div>
      <div className="grid gap-3 md:hidden">
        {people.map((person) => {
          const isCurrentViewer = person.user_id === currentViewerId;
          const displayName = getPersonDisplayName(
            person,
            t("fallback.unnamedUser"),
          );

          return (
            <article
              className="rounded-[18px] border border-[#ebe7e1] bg-white p-4 shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
              key={person.user_id}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  aria-label={t("actions.openDetailsFor", {
                    name: displayName,
                  })}
                  className="min-w-0 text-left"
                  onClick={() => onAdjustPerson(person)}
                  type="button"
                >
                  <span className="block break-words font-semibold text-[#23313a] [overflow-wrap:anywhere]">
                    {displayName}
                  </span>
                  <span className="mt-1 block break-all text-sm text-[#6f7b85]">
                    {getPersonContact(person, fallback)}
                  </span>
                </button>
                <StatusChip
                  label={statusLabels[person.status]}
                  status={person.status}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-[#eef3f6] px-3 py-1 text-xs font-semibold text-[#486782]">
                  {getRoleLabel(person.role, roleLabels, fallback)}
                </span>
                <span className="inline-flex rounded-full bg-[#f6f4f0] px-3 py-1 text-xs font-semibold text-[#66727d]">
                  {person.city ?? fallback}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 break-words text-sm text-[#6f7b85]">
                备注：{person.private_note ?? t("fallback.noPrivateNote")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="h-9 rounded-full border border-[#d9e0e5] bg-white px-3 text-[#486782] hover:bg-[#f3f6f8]"
                  onClick={() => onEditPersonNote(person)}
                >
                  <StickyNote className="size-4" />
                  {t("actions.note")}
                </Button>
                <Button
                  className="h-9 rounded-full bg-[#486782] px-3 text-white hover:bg-[#3e5f79] disabled:bg-[#d9dee2] disabled:text-[#7c8790]"
                  disabled={isCurrentViewer}
                  onClick={() => onAdjustPerson(person)}
                >
                  {isCurrentViewer
                    ? t("actions.currentAccount")
                    : t("actions.adjust")}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function StatusChip({ label, status }: { label: string; status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        status === "active" && "bg-[#e8f4ec] text-[#4c7259]",
        status === "inactive" && "bg-[#fff5db] text-[#9a6a07]",
        status === "suspended" && "bg-[#fbe6e6] text-[#b13d3d]",
      )}
    >
      {label}
    </span>
  );
}
