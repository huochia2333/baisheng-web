import type {
  AdminTaskRow,
  TaskTargetRole,
  TaskTypeOption,
} from "@/lib/admin-tasks";

export type CreateTaskFormState = {
  taskName: string;
  taskIntro: string;
  taskTypeCode: string;
  commissionAmount: string;
  targetRoles: TaskTargetRole[];
  files: File[];
};

export type AssignmentFormState = {
  targetRoles: TaskTargetRole[];
};

export function createEmptyTaskForm(
  taskTypeOptions: TaskTypeOption[] = [],
): CreateTaskFormState {
  const defaultTaskType = taskTypeOptions.find((taskType) => taskType.isActive) ?? null;

  return {
    taskName: "",
    taskIntro: "",
    taskTypeCode: defaultTaskType?.code ?? "",
    commissionAmount:
      defaultTaskType !== null
        ? formatTaskCommissionInput(defaultTaskType.defaultCommissionAmountRmb)
        : "",
    targetRoles: [],
    files: [],
  };
}

export function createEmptyAssignmentForm(): AssignmentFormState {
  return {
    targetRoles: [],
  };
}

export function createTaskFormFromTask(task: AdminTaskRow): CreateTaskFormState {
  return {
    taskName: task.task_name,
    taskIntro: task.task_intro ?? "",
    taskTypeCode: task.task_type_code,
    commissionAmount: formatTaskCommissionInput(task.commission_amount_rmb),
    targetRoles: task.target_roles,
    files: [],
  };
}

export function canEditTask(task: AdminTaskRow) {
  void task;
  return true;
}

export function canDeleteTask(task: AdminTaskRow) {
  void task;
  return true;
}

export function canReassignTask(task: AdminTaskRow) {
  return task.status === "to_be_accepted";
}

export function formatTaskCommissionInput(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "";
}
