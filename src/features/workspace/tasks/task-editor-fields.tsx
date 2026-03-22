"use client";

import { type KeyboardEvent, useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type Project } from "@/features/workspace/core";
import { inboxPickerLabel, readProjectPickerValue } from "@/features/workspace/projects";

import {
  formatTaskTagString,
  parseTaskTagString,
  TaskTagCombobox,
} from "./task-tag-combobox";

interface TaskEditorFieldsProps {
  allTags: string[];
  details: string;
  focusTitleInputSignal?: number;
  isSubmitDisabled?: boolean;
  onCancel?: () => void;
  onDetailsChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onProjectChange: (value: string) => void;
  onSubmit?: () => void;
  onTagsChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  projectId: string;
  projects: Project[];
  submitHint?: string;
  submitLabel?: string;
  tags: string;
  title: string;
}

/**
 * Provides one shared labeled task form so create and edit flows all speak the same shadcn-first
 * design language.
 */
export function TaskEditorFields({
  allTags,
  details,
  focusTitleInputSignal,
  isSubmitDisabled = false,
  onCancel,
  onDetailsChange,
  onKeyDown,
  onProjectChange,
  onSubmit,
  onTagsChange,
  onTitleChange,
  projectId,
  projects,
  submitHint,
  submitLabel,
  tags,
  title,
}: TaskEditorFieldsProps) {
  const titleInputId = useId();
  const detailsInputId = useId();
  const projectTriggerId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const selectedTags = parseTaskTagString(tags);
  const hasFooter = Boolean(submitHint || onCancel || (submitLabel && onSubmit));

  /**
   * Focuses the title input on open and on later explicit refocus requests like Cmd+N.
   */
  useEffect(() => {
    titleInputRef.current?.focus();
  }, [focusTitleInputSignal]);

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
      className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
        <div className="space-y-2">
          <Label htmlFor={titleInputId}>Task title</Label>
          <Input
            id={titleInputId}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="What needs to happen?"
            ref={titleInputRef}
            value={title}
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <TaskTagCombobox
            allTags={allTags}
            onChange={(nextTags) => onTagsChange(formatTaskTagString(nextTags))}
            selectedTags={selectedTags}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={detailsInputId}>Details</Label>
        <Textarea
          id={detailsInputId}
          onChange={(event) => onDetailsChange(event.target.value)}
          placeholder="Add details..."
          value={details}
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={projectTriggerId}>Project</Label>
        <Select
          onValueChange={(value) => onProjectChange(value === "_inbox" ? "" : value)}
          value={readProjectPickerValue(projectId) || "_inbox"}
        >
          <SelectTrigger aria-label="Project" id={projectTriggerId}>
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
      </div>

      {hasFooter ? (
        <div className="mt-4 space-y-3">
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[color:var(--muted)]">{submitHint ?? ""}</div>

            <div className="flex items-center gap-2">
              {onCancel ? (
                <Button onClick={onCancel} size="sm" variant="ghost">
                  Cancel
                </Button>
              ) : null}
              {submitLabel && onSubmit ? (
                <Button disabled={isSubmitDisabled} onClick={onSubmit} size="sm">
                  {submitLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
