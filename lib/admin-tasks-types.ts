import type { User } from "@supabase/supabase-js";

import type { TeamOverview } from "./team-management";
import type { AppRole, UserStatus } from "./user-self-service";

export type TaskScope = "public" | "team";
export type TaskStatus =
  | "to_be_accepted"
  | "accepted"
  | "reviewing"
  | "rejected"
  | "completed";
export type AdminTaskStatusFilter = "all" | TaskStatus;
export type AdminTaskScopeFilter = "all" | TaskScope;

export type AdminTaskViewerContext = {
  user: User;
  role: AppRole | null;
  status: UserStatus | null;
};

export type TaskProfileSummary = {
  user_id: string;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
};

export type TaskTeamSummary = {
  id: string;
  team_name: string | null;
};

export type TaskTypeOption = {
  code: string;
  displayName: string;
  description: string | null;
  defaultCommissionAmountRmb: number;
  isActive: boolean;
  sortOrder: number;
};

export type AdminTaskAttachment = {
  id: string;
  task_id: string;
  task_attachment_storage_path: string;
  file_size_bytes: number;
  original_name: string;
  bucket_name: string;
  mime_type: string;
  uploaded_by_user_id: string;
  created_at: string | null;
};

export type AdminTaskMainRow = {
  id: string;
  task_name: string;
  task_intro: string | null;
  task_type_code: string;
  task_type_label: string | null;
  commission_amount_rmb: number;
  created_by_user_id: string;
  accepted_by_user_id: string | null;
  scope: TaskScope;
  team_id: string | null;
  status: TaskStatus;
  created_at: string | null;
  accepted_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  review_reject_reason: string | null;
  completed_at: string | null;
};

export type AdminTaskRow = AdminTaskMainRow & {
  creator: TaskProfileSummary | null;
  accepted_by: TaskProfileSummary | null;
  team: TaskTeamSummary | null;
  attachments: AdminTaskAttachment[];
};

export type AdminTasksPageData = {
  viewerId: string | null;
  viewerRole: AppRole | null;
  viewerStatus: UserStatus | null;
  canView: boolean;
  tasks: AdminTaskRow[];
  teamOptions: TeamOverview[];
  taskTypeOptions: TaskTypeOption[];
};

export type AdminTasksFilters = {
  searchText: string;
  scope: AdminTaskScopeFilter;
  status: AdminTaskStatusFilter;
  teamId: string;
};

export type AdminTasksSearchParams = {
  filters: AdminTasksFilters;
  page: number;
};

export type CreateAdminTaskInput = {
  taskName: string;
  taskIntro?: string | null;
  taskTypeCode: string;
  commissionAmountRmb: number;
  createdByUserId: string;
  scope: TaskScope;
  teamId?: string | null;
};

export type UpdateAdminTaskInput = {
  taskId: string;
  taskName: string;
  taskIntro?: string | null;
  taskTypeCode: string;
  commissionAmountRmb: number;
  scope: TaskScope;
  teamId?: string | null;
};

export type UpdateAdminTaskAssignmentInput = {
  taskId: string;
  scope: TaskScope;
  teamId?: string | null;
};

export type TaskMainRecord = {
  id: string;
  task_name: string | null;
  task_intro: string | null;
  task_type_code: string | null;
  commission_amount_rmb: number | string | null;
  created_by_user_id: string | null;
  accepted_by_user_id: string | null;
  scope: TaskScope | null;
  team_id: string | null;
  status: TaskStatus | null;
  created_at: string | null;
  accepted_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  review_reject_reason: string | null;
  completed_at: string | null;
};

export type TaskAttachmentRecord = {
  id: string;
  task_id: string | null;
  task_attachment_storage_path: string | null;
  file_size_bytes: number | string | null;
  original_name: string | null;
  bucket_name: string | null;
  mime_type: string | null;
  uploaded_by_user_id: string | null;
  created_at: string | null;
};

export type UserProfileRecord = {
  user_id: string | null;
  name: string | null;
  email: string | null;
  status: UserStatus | null;
};

export type TeamProfileRecord = {
  id: string | null;
  team_name: string | null;
};

export type TaskTypeCatalogRecord = {
  code: string | null;
  display_name: string | null;
  description: string | null;
  default_commission_amount_rmb: number | string | null;
  is_active: boolean | null;
  sort_order: number | string | null;
};
