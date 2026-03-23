"use client";

import { type KeyboardEvent } from "react";

import { type Project, type Task } from "@/features/workspace/core";

import { TaskEditorFields } from "./task-editor-fields";

interface TaskInlineEditorProps {
  allTags: string[];
  editDetails: string;
  editDueBy: string;
  editProject: string;
  editRemindOn: string;
  editTags: string;
  editTitle: string;
  onCancel: () => void;
  onDelete: (taskId: string) => void;
  onSave: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditDueBy: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditRemindOn: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  projects: Project[];
  task: Task;
}

/**
 * Reuses the shared task editor fields inline beneath a row while adding the quiet delete action
 * requested for the no-drill-down editing flow.
 */
export function TaskInlineEditor({
  allTags,
  editDetails,
  editDueBy,
  editProject,
  editRemindOn,
  editTags,
  editTitle,
  onCancel,
  onDelete,
  onSave,
  onSetEditDetails,
  onSetEditDueBy,
  onSetEditProject,
  onSetEditRemindOn,
  onSetEditTags,
  onSetEditTitle,
  projects,
  task,
}: TaskInlineEditorProps) {
  /**
   * Lets the inline editor dismiss on Escape without interfering with the shared submit shortcut.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    onCancel();
  }

  return (
    <div className="space-y-2">
      <TaskEditorFields
        allTags={allTags}
        details={editDetails}
        dueBy={editDueBy}
        isSubmitDisabled={!editTitle.trim()}
        onCancel={onCancel}
        onDetailsChange={onSetEditDetails}
        onDueByChange={onSetEditDueBy}
        onKeyDown={handleKeyDown}
        onProjectChange={onSetEditProject}
        onRemindOnChange={onSetEditRemindOn}
        onSubmit={() => onSave(task.id)}
        onTagsChange={onSetEditTags}
        onTitleChange={onSetEditTitle}
        projectId={editProject}
        projects={projects}
        remindOn={editRemindOn}
        submitHint="⌘↵"
        submitLabel="Save"
        tags={editTags}
        title={editTitle}
      />

      <div className="flex justify-end">
        <button
          className="text-[11px] text-rose-600 transition-colors hover:text-rose-700"
          onClick={() => onDelete(task.id)}
          type="button"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
