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
  onOpenThread?: () => void;
  onSave: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditDueBy: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditRemindOn: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  projects: Project[];
  task: Task;
  threadMessageCount?: number;
}

/**
 * Wraps the shared task editor fields for inline editing beneath a task row.
 * Thread access is a small icon in the editor header; delete lives in the action bar.
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
  onOpenThread,
  onSave,
  onSetEditDetails,
  onSetEditDueBy,
  onSetEditProject,
  onSetEditRemindOn,
  onSetEditTags,
  onSetEditTitle,
  projects,
  task,
  threadMessageCount,
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
    <TaskEditorFields
      allTags={allTags}
      details={editDetails}
      dueBy={editDueBy}
      isSubmitDisabled={!editTitle.trim()}
      onCancel={onCancel}
      onDelete={() => onDelete(task.id)}
      onDetailsChange={onSetEditDetails}
      onDueByChange={onSetEditDueBy}
      onKeyDown={handleKeyDown}
      onOpenThread={onOpenThread}
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
      threadMessageCount={threadMessageCount}
      title={editTitle}
    />
  );
}
