"use client";

import { type KeyboardEvent, useRef, useState } from "react";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type Task } from "@/features/workspace/core";
import { cn } from "@/lib/utils";

interface TaskTagComboboxProps {
  allTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

/**
 * Uses a stock popover-plus-input composition so task tags behave like the rest of the shadcn
 * form controls while still supporting quick add and remove flows.
 */
export function TaskTagCombobox({
  allTags,
  selectedTags,
  onChange,
}: TaskTagComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tagQuery, setTagQuery] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const suggestions = readTaskTagSuggestions(allTags, tagQuery, selectedTags);
  const normalizedQuery = normalizeTaskTag(tagQuery);
  const hasExistingExactMatch = allTags.some(
    (tag) => normalizeTaskTag(tag).toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
  );
  const isSelectedExactMatch = selectedTags.some(
    (tag) => normalizeTaskTag(tag).toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
  );
  const canCreateTag =
    normalizedQuery.length > 0 && !hasExistingExactMatch && !isSelectedExactMatch;

  /**
   * Adds a confirmed tag, clears the current search state, and keeps focus in the popover search.
   */
  function handleConfirmTag(nextTag: string) {
    const normalizedTag = normalizeTaskTag(nextTag);

    if (!normalizedTag) {
      return;
    }

    onChange(appendTaskTag(selectedTags, normalizedTag));
    setTagQuery("");
    inputRef.current?.focus();
  }

  /**
   * Removes a tag from the current draft without changing the surrounding editor state.
   */
  function handleRemoveTag(tagToRemove: string) {
    onChange(
      selectedTags.filter(
        (tag) => tag.toLocaleLowerCase() !== tagToRemove.toLocaleLowerCase(),
      ),
    );
  }

  /**
   * Keeps Enter and comma scoped to tag creation so the parent task editor does not submit early.
   */
  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      if (!normalizedQuery) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleConfirmTag(suggestions[0] ?? normalizedQuery);
      return;
    }

    if (event.key === "Escape") {
      event.stopPropagation();
      setIsPopoverOpen(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-[color:var(--muted)]">No tags selected</span>
        ) : null}

        {selectedTags.map((tag) => (
          <button
            aria-label={`Remove ${tag} tag`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--muted-strong)] transition-colors",
              "hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]",
            )}
            key={tag}
            onClick={() => handleRemoveTag(tag)}
            type="button"
          >
            <span>{tag}</span>
            <X aria-hidden="true" className="size-3" />
          </button>
        ))}

        <Popover
          onOpenChange={(nextOpen) => {
            setIsPopoverOpen(nextOpen);

            if (!nextOpen) {
              setTagQuery("");
            }
          }}
          open={isPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              aria-label="Add tag"
              className="ml-auto h-7 px-2 text-xs"
              size="sm"
              variant="ghost"
            >
              Add tag
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-80 space-y-3"
            onEscapeKeyDown={(event) => {
              event.stopPropagation();
            }}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[color:var(--popover-foreground)]">
                Choose tags
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                Search existing tags or create a new one.
              </p>
            </div>

            <Input
              aria-label="Tag search"
              onChange={(event) => setTagQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search or create tags"
              ref={inputRef}
              value={tagQuery}
            />

            <div className="space-y-1.5">
              {canCreateTag ? (
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    "text-[color:var(--popover-foreground)] hover:bg-[color:var(--surface-muted)]",
                  )}
                  onClick={() => handleConfirmTag(normalizedQuery)}
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4 text-[color:var(--muted)]" />
                  <span>
                    Create &quot;
                    {normalizedQuery}
                    &quot;
                  </span>
                </button>
              ) : null}

              {suggestions.map((tag) => (
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    "text-[color:var(--popover-foreground)] hover:bg-[color:var(--surface-muted)]",
                  )}
                  key={tag}
                  onClick={() => handleConfirmTag(tag)}
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4 text-[color:var(--muted)]" />
                  <span>{tag}</span>
                </button>
              ))}

              {suggestions.length === 0 && !canCreateTag ? (
                <p className="rounded-md border border-dashed border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--muted)]">
                  No matching tags yet.
                </p>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/**
 * Collects the workspace tag vocabulary in first-seen order while ignoring case-only duplicates.
 */
export function collectTaskTags(tasks: Pick<Task, "tags">[]) {
  const seenTags = new Set<string>();
  const uniqueTags: string[] = [];

  for (const task of tasks) {
    for (const rawTag of task.tags) {
      const normalizedTag = normalizeTaskTag(rawTag);

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
 * exclusion so the tag picker never offers duplicates back to the user.
 */
export function readTaskTagSuggestions(
  allTags: string[],
  query: string,
  selectedTags: string[],
) {
  const normalizedQuery = normalizeTaskTag(query).toLocaleLowerCase();
  const selectedTagKeys = new Set(
    selectedTags.map((tag) => normalizeTaskTag(tag).toLocaleLowerCase()),
  );

  return allTags.filter((tag) => {
    const normalizedTag = normalizeTaskTag(tag);
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

/**
 * Converts the existing comma-separated task tag storage format into the array form used by the
 * shared task editor.
 */
export function parseTaskTagString(tags: string) {
  return tags
    .split(",")
    .map((tag) => normalizeTaskTag(tag))
    .filter((tag) => tag.length > 0);
}

/**
 * Writes selected tags back into the current comma-separated storage contract without changing the
 * parent state shape.
 */
export function formatTaskTagString(tags: string[]) {
  return tags.join(", ");
}

/**
 * Appends a new normalized tag only when it is not already present in the current draft.
 */
function appendTaskTag(selectedTags: string[], nextTag: string) {
  const normalizedTag = normalizeTaskTag(nextTag);

  if (!normalizedTag) {
    return selectedTags;
  }

  const comparisonKey = normalizedTag.toLocaleLowerCase();

  if (selectedTags.some((tag) => tag.toLocaleLowerCase() === comparisonKey)) {
    return selectedTags;
  }

  return [...selectedTags, normalizedTag];
}

/**
 * Trims task tags into a stable format so autocomplete and storage compare like with like.
 */
function normalizeTaskTag(tag: string) {
  return tag.replaceAll(",", " ").trim().replace(/\s+/gu, " ");
}
