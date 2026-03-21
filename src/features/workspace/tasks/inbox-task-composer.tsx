"use client";

import { type KeyboardEvent } from "react";

import { type Project } from "@/features/workspace/core";

import { TaskEditorFields } from "./task-editor-fields";

interface InboxTaskComposerProps {
  allTags: string[];
  focusTitleInputSignal: number;
  isExpanded: boolean;
  newTaskDetails: string;
  newTaskProject: string;
  newTaskTags: string;
  newTaskTitle: string;
  onCollapse: () => void;
  onExpand: () => void;
  onSetNewTaskDetails: (value: string) => void;
  onSetNewTaskProject: (value: string) => void;
  onSetNewTaskTags: (value: string) => void;
  onSetNewTaskTitle: (value: string) => void;
  onSubmit: () => void;
  projects: Project[];
}

/**
 * Renders the inbox-specific lightweight composer and keeps its tag autocomplete UI self-contained.
 */
export function InboxTaskComposer({
  allTags,
  focusTitleInputSignal,
  isExpanded,
  newTaskDetails,
  newTaskProject,
  newTaskTags,
  newTaskTitle,
  onCollapse,
  onExpand,
  onSetNewTaskDetails,
  onSetNewTaskProject,
  onSetNewTaskTags,
  onSetNewTaskTitle,
  onSubmit,
  projects,
}: InboxTaskComposerProps) {
  /**
   * Collapses the composer only after inner controls like the tag combobox have had a chance to
   * consume Escape for themselves.
   */
  function handleComposerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    onCollapse();
  }

  if (!isExpanded) {
    return (
      <button
        aria-expanded={false}
        className="text-left text-sm font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
        onClick={onExpand}
        type="button"
      >
        + Add task
      </button>
    );
  }

  return (
    <TaskEditorFields
      allTags={allTags}
      details={newTaskDetails}
      focusTitleInputSignal={focusTitleInputSignal}
      isSubmitDisabled={!newTaskTitle.trim()}
      onDetailsChange={onSetNewTaskDetails}
      onKeyDown={handleComposerKeyDown}
      onProjectChange={onSetNewTaskProject}
      onSubmit={onSubmit}
      onTagsChange={onSetNewTaskTags}
      onTitleChange={onSetNewTaskTitle}
      projectId={newTaskProject}
      projects={projects}
      submitHint="⌘↵"
      tags={newTaskTags}
      title={newTaskTitle}
    />
  );
}
