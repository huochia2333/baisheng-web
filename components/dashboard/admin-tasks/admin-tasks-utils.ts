import type {
  AdminTaskRow,
  TaskScope,
} from "@/lib/admin-tasks";

export type CreateTaskFormState = {
  taskName: string;
  taskIntro: string;
  scope: TaskScope;
  teamId: string;
  files: File[];
};

export type AssignmentFormState = {
  scope: TaskScope;
  teamId: string;
};

export function createEmptyTaskForm(): CreateTaskFormState {
  return {
    taskName: "",
    taskIntro: "",
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
