"use client";

import { type KeyboardEvent, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Project } from "@/features/workspace/core";

import { type TaskComposerSubmitData } from "./task-composer";
import { parseTaskTagString } from "./task-tag-combobox";
import { TaskEditorFields } from "./task-editor-fields";
import { useTaskComposerDraft } from "./use-task-composer-draft";

interface QuickAddDialogProps {
  allTags: string[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskComposerSubmitData) => void;
  projects: Project[];
}

/**
 * A global quick-add overlay for capturing tasks from any view via ⌘⇧N.
 * Manages its own draft state internally so the parent only needs to handle
 * open/close and the final submit payload.
 */
export function QuickAddDialog({
  allTags,
  isOpen,
  onClose,
  onSubmit,
  projects,
}: QuickAddDialogProps) {
  const { draft, setField, resetDraft } = useTaskComposerDraft();

  /**
   * Resets draft fields whenever the dialog closes so each open starts clean.
   */
  useEffect(() => {
    if (!isOpen) {
      resetDraft();
    }
  }, [isOpen, resetDraft]);

  if (!isOpen) {
    return null;
  }

  function handleSubmitAndClose() {
    if (!draft.title.trim()) {
      return;
    }

    onSubmit({
      title: draft.title,
      details: draft.details,
      dueBy: draft.dueBy,
      remindOn: draft.remindOn,
      projectId: draft.projectId,
      tags: parseTaskTagString(draft.tags),
    });
    onClose();
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && onClose()} open={isOpen}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">Quick add task</DialogTitle>
        <DialogDescription className="sr-only">
          Capture a new task from anywhere in the workspace.
        </DialogDescription>

        <div className="p-3">
          <TaskEditorFields
            allTags={allTags}
            details={draft.details}
            dueBy={draft.dueBy}
            isSubmitDisabled={!draft.title.trim()}
            onDetailsChange={(value) => setField("details", value)}
            onDueByChange={(value) => setField("dueBy", value)}
            onKeyDown={handleEditorKeyDown}
            onProjectChange={(value) => setField("projectId", value)}
            onRemindOnChange={(value) => setField("remindOn", value)}
            onSubmit={handleSubmitAndClose}
            onTagsChange={(value) => setField("tags", value)}
            onTitleChange={(value) => setField("title", value)}
            projectId={draft.projectId}
            projects={projects}
            remindOn={draft.remindOn}
            submitHint="⌘↵"
            tags={draft.tags}
            title={draft.title}
          />
        </div>

        <div className="px-3 pb-2 text-right text-xs text-[color:var(--muted)]">
          <kbd>Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
