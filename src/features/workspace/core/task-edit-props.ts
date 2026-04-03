import type { TaskComposerSubmitData } from "@/features/workspace/tasks";

/**
 * Read-only field values for the inline task editor. Every view that
 * renders the TaskInlineEditor needs these same fields.
 */
export interface TaskEditState {
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  editDueBy: string;
  editProject: string;
  editRemindOn: string;
  editTags: string;
}

/**
 * Callbacks that drive the inline task editor. Paired with TaskEditState
 * so each view doesn't need to re-declare 13+ handler props individually.
 */
export interface TaskEditCallbacks {
  onSetEditTitle: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditDueBy: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditRemindOn: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onToggleTaskCompleted: (taskId: string) => void;
  onAddTask: (data: TaskComposerSubmitData) => void;
}
