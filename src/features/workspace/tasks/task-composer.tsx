"use client";

import { type KeyboardEvent, useMemo, useState } from "react";

import { type Project } from "@/features/workspace/core";

import { parseTaskTagString } from "./task-tag-combobox";
import { TaskEditorFields } from "./task-editor-fields";
import { useTaskComposerDraft } from "./use-task-composer-draft";

export interface TaskComposerSubmitData {
  title: string;
  details: string;
  dueBy: string;
  remindOn: string;
  projectId: string;
  tags: string[];
}

interface TaskComposerProps {
  allTags: string[];
  defaultProjectId?: string;
  focusSignal?: number;
  onSubmit: (data: TaskComposerSubmitData) => void;
  projects: Project[];
  submitLabel?: string;
}

/**
 * A self-contained inline task composer that manages its own form state and expand/collapse
 * lifecycle. Every task creation surface — inbox, tasks view, project detail — uses this single
 * component so changes to the creation box only need to happen in one place.
 */
export function TaskComposer({
  allTags,
  defaultProjectId,
  focusSignal,
  onSubmit,
  projects,
  submitLabel,
}: TaskComposerProps) {
  const defaults = useMemo(
    () => (defaultProjectId ? { projectId: defaultProjectId } : undefined),
    [defaultProjectId],
  );
  const { draft, setField, resetDraft } = useTaskComposerDraft(defaults);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevFocusSignal, setPrevFocusSignal] = useState(focusSignal ?? 0);

  /**
   * Expands the composer synchronously during render when the parent increments the focus signal,
   * such as in response to a keyboard shortcut like Cmd+N. Uses the "store previous props in
   * state" pattern recommended by React to avoid effects.
   */
  if (focusSignal !== undefined && focusSignal > 0 && focusSignal !== prevFocusSignal) {
    setPrevFocusSignal(focusSignal);

    if (!isExpanded) {
      setIsExpanded(true);
    }
  }

  function handleExpand() {
    if (defaultProjectId) {
      setField("projectId", defaultProjectId);
    }

    setIsExpanded(true);
  }

  function handleCollapse() {
    setIsExpanded(false);
    resetDraft();
  }

  function handleSubmit() {
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
    resetDraft();
    setIsExpanded(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    handleCollapse();
  }

  if (!isExpanded) {
    return (
      <button
        aria-expanded={false}
        className="text-left text-sm font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
        onClick={handleExpand}
        type="button"
      >
        + Add task
      </button>
    );
  }

  return (
    <TaskEditorFields
      allTags={allTags}
      details={draft.details}
      dueBy={draft.dueBy}
      focusTitleInputSignal={focusSignal}
      isSubmitDisabled={!draft.title.trim()}
      onCancel={submitLabel ? handleCollapse : undefined}
      onDetailsChange={(value) => setField("details", value)}
      onDueByChange={(value) => setField("dueBy", value)}
      onKeyDown={handleKeyDown}
      onProjectChange={(value) => setField("projectId", value)}
      onRemindOnChange={(value) => setField("remindOn", value)}
      onSubmit={handleSubmit}
      onTagsChange={(value) => setField("tags", value)}
      onTitleChange={(value) => setField("title", value)}
      projectId={draft.projectId}
      projects={projects}
      remindOn={draft.remindOn}
      submitHint="⌘↵"
      submitLabel={submitLabel}
      tags={draft.tags}
      title={draft.title}
    />
  );
}
