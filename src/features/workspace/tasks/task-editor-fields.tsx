"use client";

import { type ChangeEvent, type KeyboardEvent, useCallback, useEffect, useRef } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Project } from "@/features/workspace/core";
import { inboxPickerLabel, readProjectPickerValue } from "@/features/workspace/projects";
import { cn } from "@/lib/utils";

import {
  formatTaskTagString,
  parseTaskTagString,
  TaskTagCombobox,
} from "./task-tag-combobox";

interface TaskEditorFieldsProps {
  allTags: string[];
  details: string;
  dueBy: string;
  focusTitleInputSignal?: number;
  isSubmitDisabled?: boolean;
  onCancel?: () => void;
  onDetailsChange: (value: string) => void;
  onDueByChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onProjectChange: (value: string) => void;
  onRemindOnChange: (value: string) => void;
  onSubmit?: () => void;
  onTagsChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  projectId: string;
  projects: Project[];
  remindOn: string;
  submitHint?: string;
  submitLabel?: string;
  tags: string;
  title: string;
}

/**
 * Reuses the issue-24 no-chrome task input language for any task create or edit surface.
 */
export function TaskEditorFields({
  allTags,
  details,
  dueBy,
  focusTitleInputSignal,
  isSubmitDisabled = false,
  onCancel,
  onDetailsChange,
  onDueByChange,
  onKeyDown,
  onProjectChange,
  onRemindOnChange,
  onSubmit,
  onTagsChange,
  onTitleChange,
  projectId,
  projects,
  remindOn,
  submitHint,
  submitLabel,
  tags,
  title,
}: TaskEditorFieldsProps) {
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const selectedTags = parseTaskTagString(tags);

  /**
   * Auto-sizes the title textarea to its content so it grows with long titles but never shows
   * a scrollbar.
   */
  const resizeTitleTextarea = useCallback(() => {
    const element = titleInputRef.current;

    if (!element) {
      return;
    }

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  /**
   * Focuses the title input on open and on later explicit refocus requests like Cmd+N.
   */
  useEffect(() => {
    titleInputRef.current?.focus();
    resizeTitleTextarea();
  }, [focusTitleInputSignal, resizeTitleTextarea]);

  /**
   * Preserves the shared Cmd/Ctrl+Enter submit gesture while still allowing parent-specific
   * keyboard behavior like Escape-to-collapse.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();

      if (!isSubmitDisabled) {
        onSubmit?.();
      }

      return;
    }

    onKeyDown?.(event);
  }

  return (
    <div
      className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)]/90 px-3 py-1.5"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-3">
        <textarea
          aria-label="Task title"
          className={cn(
            "min-w-0 basis-3/4 resize-none overflow-hidden border-0 border-b border-[color:var(--border)] bg-transparent px-0 pb-2 pt-0 text-sm text-[color:var(--foreground)] shadow-none outline-none transition-colors",
            "placeholder:text-[color:var(--muted)] placeholder:opacity-70 focus:border-[color:var(--border-strong)]",
          )}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            onTitleChange(event.target.value.replace(/\n/g, " "));
            resizeTitleTextarea();
          }}
          placeholder="Task title"
          ref={titleInputRef}
          rows={1}
          value={title}
        />

        <div className="basis-1/4">
          <TaskTagCombobox
            allTags={allTags}
            onChange={(nextTags) => onTagsChange(formatTaskTagString(nextTags))}
            selectedTags={selectedTags}
          />
        </div>
      </div>

      <Textarea
        aria-label="Task details"
        className="mt-2 min-h-20 resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[12px] leading-5 focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0"
        onChange={(event) => onDetailsChange(event.target.value)}
        placeholder="Add details..."
        value={details}
      />

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            onValueChange={(value) => onProjectChange(value === "_inbox" ? "" : value)}
            value={readProjectPickerValue(projectId) || "_inbox"}
          >
            <SelectTrigger
              aria-label="Project"
              className="h-8 w-auto min-w-[11rem] rounded-none border-0 bg-transparent px-0 py-0 text-xs text-[color:var(--muted)] focus:bg-transparent focus:ring-0"
            >
              <SelectValue placeholder={inboxPickerLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_inbox">{inboxPickerLabel}</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TaskDateField
            ariaLabel="Remind on"
            label="Remind on"
            onChange={onRemindOnChange}
            value={remindOn}
          />
          <TaskDateField
            ariaLabel="Due by"
            label="Due by"
            onChange={onDueByChange}
            value={dueBy}
          />
        </div>

        <div className="flex items-center gap-3">
          {submitHint ? (
            <span className="text-[11px] text-[color:var(--muted)]">{submitHint}</span>
          ) : null}
          {onCancel ? (
            <button
              className="text-[11px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          ) : null}
          {submitLabel && onSubmit ? (
            <button
              className="text-[11px] font-medium text-[color:var(--foreground)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isSubmitDisabled}
              onClick={onSubmit}
              type="button"
            >
              {submitLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface TaskDateFieldProps {
  ariaLabel: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

function TaskDateField({
  ariaLabel,
  label,
  onChange,
  value,
}: TaskDateFieldProps) {
  return (
    <label className="flex min-w-[8.75rem] flex-col gap-1 text-[11px] text-[color:var(--muted)]">
      <span>{label}</span>
      <input
        aria-label={ariaLabel}
        className="h-8 rounded-none border-0 border-b border-[color:var(--border)] bg-transparent px-0 py-0 text-xs text-[color:var(--muted-strong)] outline-none transition-colors focus:border-[color:var(--border-strong)]"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}
