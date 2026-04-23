import type {
  AdminTaskRow,
  AdminTasksFilters,
} from "@/lib/admin-tasks";
import type { DashboardPaginationSlice } from "@/lib/dashboard-pagination";

import type { NoticeTone } from "../dashboard-shared-ui";

export type PageFeedbackValue = {
  tone: NoticeTone;
  message: string;
};

export type PageFeedback = PageFeedbackValue | null;

export type AdminTasksStats = {
  total: number;
  pending: number;
  accepted: number;
  reviewing: number;
  rejected: number;
  completed: number;
};

export type AdminTasksPagination = DashboardPaginationSlice<AdminTaskRow>;

export const taskInputClassName =
  "h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";
export const taskSelectClassName =
  "h-12 w-full rounded-[18px] border border-[#dfe5ea] bg-white px-4 text-sm text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";
export const taskTextareaClassName =
  "min-h-[150px] w-full rounded-[22px] border border-[#dfe5ea] bg-white px-4 py-3 text-sm leading-7 text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30";

export function areAdminTaskFiltersEqual(
  left: AdminTasksFilters,
  right: AdminTasksFilters,
) {
  return (
    left.searchText === right.searchText &&
    left.scope === right.scope &&
    left.status === right.status &&
    left.teamId === right.teamId
  );
}
