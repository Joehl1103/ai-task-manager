"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { X } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Project, type Task } from "@/features/workspace/core";
import { inboxPickerLabel } from "@/features/workspace/projects";
import { cn } from "@/lib/utils";

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
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagListboxId = useId();
  const [tagQuery, setTagQuery] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const selectedTags = parseInboxComposerTagString(newTaskTags);
  const tagSuggestions = readInboxTagSuggestions(allTags, tagQuery, selectedTags);
  const highlightedSuggestionIndex =
    tagSuggestions.length === 0
      ? 0
      : Math.min(activeSuggestionIndex, tagSuggestions.length - 1);
  const isShowingTagDropdown = isExpanded && isTagDropdownOpen && tagSuggestions.length > 0;

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    titleInputRef.current?.focus();
  }, [focusTitleInputSignal, isExpanded]);

  function handleCollapse() {
    setTagQuery("");
    setIsTagDropdownOpen(false);
    setActiveSuggestionIndex(0);
    onCollapse();
  }

  function handleConfirmTag(nextTag: string) {
    const normalizedTag = normalizeInboxComposerTag(nextTag);

    if (!normalizedTag) {
      setIsTagDropdownOpen(false);
      return;
    }

    onSetNewTaskTags(appendInboxComposerTag(selectedTags, normalizedTag).join(", "));
    setTagQuery("");
    setIsTagDropdownOpen(false);
    setActiveSuggestionIndex(0);
    tagInputRef.current?.focus();
  }

  function handleRemoveTag(tagToRemove: string) {
    onSetNewTaskTags(
      selectedTags
        .filter((tag) => tag.toLocaleLowerCase() !== tagToRemove.toLocaleLowerCase())
        .join(", "),
    );
    tagInputRef.current?.focus();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSubmit();
      return;
    }

    if (event.key === "Escape" && !isTagDropdownOpen) {
      event.preventDefault();
      handleCollapse();
    }
  }

  function handleTagInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (tagSuggestions.length === 0) {
        return;
      }

      event.preventDefault();
      setIsTagDropdownOpen(true);
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex >= tagSuggestions.length - 1 ? 0 : currentIndex + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      if (tagSuggestions.length === 0) {
        return;
      }

      event.preventDefault();
      setIsTagDropdownOpen(true);
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex <= 0 ? tagSuggestions.length - 1 : currentIndex - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (!tagQuery.trim()) {
        return;
      }

      event.preventDefault();
      handleConfirmTag(
        isShowingTagDropdown
          ? (tagSuggestions[highlightedSuggestionIndex] ?? tagQuery)
          : tagQuery,
      );
      return;
    }

    if (event.key === ",") {
      if (!tagQuery.trim()) {
        return;
      }

      event.preventDefault();
      handleConfirmTag(tagQuery);
      return;
    }

    if (event.key === "Escape" && isTagDropdownOpen) {
      event.preventDefault();
      setIsTagDropdownOpen(false);
      setActiveSuggestionIndex(0);
    }
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
    <div
      className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)]/90 px-3 py-2.5"
      onKeyDown={handleComposerKeyDown}
    >
      <div className="flex items-start gap-3">
        <input
          aria-label="Task title"
          className={cn(
            "min-w-0 flex-1 border-0 border-b border-[color:var(--border)] bg-transparent px-0 pb-2 pt-0 text-[13px] font-medium text-[color:var(--foreground)] shadow-none outline-none transition-colors",
            "placeholder:text-[color:var(--muted)] placeholder:opacity-70 focus:border-[color:var(--border-strong)]",
          )}
          onChange={(event) => onSetNewTaskTitle(event.target.value)}
          placeholder="Task title"
          ref={titleInputRef}
          value={newTaskTitle}
        />

        <div className="relative min-w-[11rem] flex-1">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {selectedTags.map((tag) => (
              <button
                aria-label={`Remove ${tag} tag`}
                className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-muted)] px-2 py-0.5 text-[11px] text-[color:var(--muted)] transition-colors hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                key={tag}
                onClick={() => handleRemoveTag(tag)}
                type="button"
              >
                <span>{tag}</span>
                <X aria-hidden="true" className="size-3" />
              </button>
            ))}

            <input
              aria-activedescendant={
                isShowingTagDropdown ? `${tagListboxId}-${activeSuggestionIndex}` : undefined
              }
              aria-controls={isShowingTagDropdown ? tagListboxId : undefined}
              aria-expanded={isShowingTagDropdown}
              aria-label="Task tags"
              aria-autocomplete="list"
              className="h-6 min-w-[5rem] flex-1 bg-transparent px-0 text-right text-[11px] text-[color:var(--muted)] outline-none placeholder:text-[color:var(--muted)] placeholder:opacity-70 focus:text-[color:var(--foreground)]"
              onBlur={() => setIsTagDropdownOpen(false)}
              onChange={(event) => {
                setTagQuery(event.target.value);
                setIsTagDropdownOpen(true);
                setActiveSuggestionIndex(0);
              }}
              onFocus={() => {
                if (tagSuggestions.length > 0) {
                  setIsTagDropdownOpen(true);
                }
              }}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add tag"
              ref={tagInputRef}
              role="combobox"
              value={tagQuery}
            />
          </div>

          {isShowingTagDropdown ? (
            <div
              className="absolute right-0 top-full z-10 mt-2 min-w-[11rem] overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--popover)]"
              id={tagListboxId}
              role="listbox"
            >
              <ul className="max-h-36 overflow-y-auto py-1">
                {tagSuggestions.map((tag, index) => {
                  const isActive = index === activeSuggestionIndex;

                  return (
                    <li key={tag}>
                      <button
                        aria-selected={isActive}
                        className={cn(
                          "w-full px-3 py-1.5 text-left text-xs transition-colors",
                          isActive
                            ? "bg-[color:var(--surface-muted)] text-[color:var(--foreground)]"
                            : "text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]",
                        )}
                        id={`${tagListboxId}-${index}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleConfirmTag(tag);
                        }}
                        role="option"
                        type="button"
                      >
                        {tag}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <Textarea
        aria-label="Task details"
        className="mt-2 min-h-20 resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[12px] leading-5 focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0"
        onChange={(event) => onSetNewTaskDetails(event.target.value)}
        placeholder="Add details..."
        value={newTaskDetails}
      />

      <div className="mt-2 flex items-center justify-between gap-4">
        <Select
          onValueChange={(value) => onSetNewTaskProject(value === "_inbox" ? "" : value)}
          value={newTaskProject || "_inbox"}
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

        <button
          className="text-[11px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          onClick={onSubmit}
          type="button"
        >
          ⌘↵
        </button>
      </div>
    </div>
  );
}

/**
 * Collects the workspace tag vocabulary in first-seen order while ignoring case-only duplicates.
 */
export function collectInboxComposerTags(tasks: Pick<Task, "tags">[]) {
  const seenTags = new Set<string>();
  const uniqueTags: string[] = [];

  for (const task of tasks) {
    for (const rawTag of task.tags) {
      const normalizedTag = normalizeInboxComposerTag(rawTag);

      if (!normalizedTag) {
        continue;
      }

      const comparisonKey = normalizedTag.toLocaleLowerCase();

      if (seenTags.has(comparisonKey)) {
        continue;
      }

      seenTags.add(comparisonKey);
      uniqueTags.push(normalizedTag);
    }
  }

  return uniqueTags;
}

/**
 * Filters autocomplete suggestions using a case-insensitive substring match and selected-tag
 * exclusion.
 */
export function readInboxTagSuggestions(
  allTags: string[],
  query: string,
  selectedTags: string[],
) {
  const normalizedQuery = normalizeInboxComposerTag(query).toLocaleLowerCase();
  const selectedTagKeys = new Set(
    selectedTags.map((tag) => normalizeInboxComposerTag(tag).toLocaleLowerCase()),
  );

  return allTags.filter((tag) => {
    const normalizedTag = normalizeInboxComposerTag(tag);
    const comparisonKey = normalizedTag.toLocaleLowerCase();

    if (!normalizedTag || selectedTagKeys.has(comparisonKey)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return comparisonKey.includes(normalizedQuery);
  });
}

function appendInboxComposerTag(selectedTags: string[], nextTag: string) {
  const normalizedTag = normalizeInboxComposerTag(nextTag);

  if (!normalizedTag) {
    return selectedTags;
  }

  const comparisonKey = normalizedTag.toLocaleLowerCase();

  if (selectedTags.some((tag) => tag.toLocaleLowerCase() === comparisonKey)) {
    return selectedTags;
  }

  return [...selectedTags, normalizedTag];
}

function normalizeInboxComposerTag(tag: string) {
  return tag.replaceAll(",", " ").trim().replace(/\s+/gu, " ");
}

function parseInboxComposerTagString(tags: string) {
  return tags
    .split(",")
    .map((tag) => normalizeInboxComposerTag(tag))
    .filter((tag) => tag.length > 0);
}
