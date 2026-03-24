"use client";

import { type KeyboardEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Project } from "@/features/workspace/core";

import { TaskEditorFields } from "./task-editor-fields";

interface QuickAddDialogProps {
  allTags: string[];
  details: string;
  dueBy: string;
  isOpen: boolean;
  onClose: () => void;
  onDetailsChange: (value: string) => void;
  onDueByChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onRemindOnChange: (value: string) => void;
  onSubmit: () => void;
  onTagsChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  projectId: string;
  projects: Project[];
  remindOn: string;
  tags: string;
  title: string;
}

/**
 * A global quick-add overlay for capturing tasks from any view via ⌘⇧N.
 * Reuses the shared TaskEditorFields inside a Radix Dialog that drops from the
 * top, matching the GlobalSearchDialog pattern.
 */
export function QuickAddDialog({
  allTags,
  details,
  dueBy,
  isOpen,
  onClose,
  onDetailsChange,
  onDueByChange,
  onProjectChange,
  onRemindOnChange,
  onSubmit,
  onTagsChange,
  onTitleChange,
  projectId,
  projects,
  remindOn,
  tags,
  title,
}: QuickAddDialogProps) {
  if (!isOpen) {
    return null;
  }

  function handleSubmitAndClose() {
    if (!title.trim()) {
      return;
    }

    onSubmit();
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
            details={details}
            dueBy={dueBy}
            isSubmitDisabled={!title.trim()}
            onDetailsChange={onDetailsChange}
            onDueByChange={onDueByChange}
            onKeyDown={handleEditorKeyDown}
            onProjectChange={onProjectChange}
            onRemindOnChange={onRemindOnChange}
            onSubmit={handleSubmitAndClose}
            onTagsChange={onTagsChange}
            onTitleChange={onTitleChange}
            projectId={projectId}
            projects={projects}
            remindOn={remindOn}
            submitHint="⌘↵"
            tags={tags}
            title={title}
          />
        </div>

        <div className="px-3 pb-2 text-right text-xs text-[color:var(--muted)]">
          <kbd>Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
