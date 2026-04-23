import type {
  AdminTaskRow,
  TaskScope,
  TaskTypeOption,
} from "@/lib/admin-tasks";

export type CreateTaskFormState = {
  taskName: string;
  taskIntro: string;
  taskTypeCode: string;
  commissionAmount: string;
  scope: TaskScope;
  teamId: string;
  files: File[];
};

export type AssignmentFormState = {
  scope: TaskScope;
  teamId: string;
};

export function createEmptyTaskForm(
  taskTypeOptions: TaskTypeOption[] = [],
): CreateTaskFormState {
  const defaultTaskType = taskTypeOptions[0] ?? null;

  return {
    taskName: "",
    taskIntro: "",
    taskTypeCode: defaultTaskType?.code ?? "",
    commissionAmount:
      defaultTaskType !== null
        ? formatTaskCommissionInput(defaultTaskType.defaultCommissionAmountRmb)
        : "",
    scope: "public",
    teamId: "",
    files: [],
  };
}

export function createEmptyAssignmentForm(): AssignmentFormState {
  return {
    scope: "public",
    teamId: "",
  };
}

export function canManageTask(task: AdminTaskRow) {
  return task.status === "to_be_accepted";
}

export function formatTaskCommissionInput(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "";
}
