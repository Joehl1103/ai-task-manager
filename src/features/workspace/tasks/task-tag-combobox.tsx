"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";

import { X } from "lucide-react";

import { type Task } from "@/features/workspace/core";
import { cn } from "@/lib/utils";

interface TaskTagComboboxProps {
  allTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

/**
 * Keeps task tag editing lightweight by combining selected pills, free-text entry, and workspace
 * suggestions into one compact inline control.
 */
export function TaskTagCombobox({
  allTags,
  selectedTags,
  onChange,
}: TaskTagComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [tagQuery, setTagQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const suggestions = readTaskTagSuggestions(allTags, tagQuery, selectedTags);
  const highlightedSuggestionIndex =
    suggestions.length === 0
      ? 0
      : Math.min(activeSuggestionIndex, suggestions.length - 1);
  const isShowingDropdown = isDropdownOpen && suggestions.length > 0;

  /**
   * Adds the confirmed tag, clears the current query, and keeps focus inside the inline editor.
   */
  function handleConfirmTag(nextTag: string) {
    const normalizedTag = normalizeTaskTag(nextTag);

    if (!normalizedTag) {
      setIsDropdownOpen(false);
      return;
    }

    onChange(appendTaskTag(selectedTags, normalizedTag));
    setTagQuery("");
    setIsDropdownOpen(false);
    setActiveSuggestionIndex(0);
    inputRef.current?.focus();
  }

  /**
   * Removes one selected tag while preserving the rest of the draft state.
   */
  function handleRemoveTag(tagToRemove: string) {
    onChange(
      selectedTags.filter(
        (tag) => tag.toLocaleLowerCase() !== tagToRemove.toLocaleLowerCase(),
      ),
    );
    inputRef.current?.focus();
  }

  /**
   * Handles keyboard selection so Enter and comma confirm tags while Escape closes only the
   * dropdown first.
   */
  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (suggestions.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsDropdownOpen(true);
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex >= suggestions.length - 1 ? 0 : currentIndex + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      if (suggestions.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsDropdownOpen(true);
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (!tagQuery.trim()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleConfirmTag(
        isShowingDropdown
          ? (suggestions[highlightedSuggestionIndex] ?? tagQuery)
          : tagQuery,
      );
      return;
    }

    if (event.key === ",") {
      if (!tagQuery.trim()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleConfirmTag(tagQuery);
      return;
    }

    if (event.key === "Escape" && isDropdownOpen) {
      event.preventDefault();
      event.stopPropagation();
      setIsDropdownOpen(false);
      setActiveSuggestionIndex(0);
    }
  }

  return (
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
            isShowingDropdown ? `${listboxId}-${highlightedSuggestionIndex}` : undefined
          }
          aria-controls={isShowingDropdown ? listboxId : undefined}
          aria-expanded={isShowingDropdown}
          aria-label="Task tags"
          aria-autocomplete="list"
          className="h-6 min-w-[5rem] flex-1 bg-transparent px-0 text-right text-[11px] text-[color:var(--muted)] outline-none placeholder:text-[color:var(--muted)] placeholder:opacity-70 focus:text-[color:var(--foreground)]"
          onBlur={() => setIsDropdownOpen(false)}
          onChange={(event) => {
            setTagQuery(event.target.value);
            setIsDropdownOpen(true);
            setActiveSuggestionIndex(0);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Add tag"
          ref={inputRef}
          role="combobox"
          value={tagQuery}
        />
      </div>

      {isShowingDropdown ? (
        <div
          className="absolute right-0 top-full z-10 mt-2 min-w-[11rem] overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--popover)]"
          id={listboxId}
          role="listbox"
        >
          <ul className="max-h-36 overflow-y-auto py-1">
            {suggestions.map((tag, index) => {
              const isActive = index === highlightedSuggestionIndex;

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
                    id={`${listboxId}-${index}`}
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
 * exclusion so the inline picker never offers duplicates back to the user.
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
 * inline combobox UI.
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
