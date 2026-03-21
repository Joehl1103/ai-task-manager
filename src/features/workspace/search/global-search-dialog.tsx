"use client";

import { type KeyboardEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  cycleGlobalSearchIndex,
  readGlobalSearchEntityLabel,
  type GlobalSearchResult,
} from "./global-search";

interface GlobalSearchDialogProps {
  isOpen: boolean;
  query: string;
  results: GlobalSearchResult[];
  activeIndex: number;
  onActiveIndexChange: (nextIndex: number) => void;
  onClose: () => void;
  onQueryChange: (nextQuery: string) => void;
  onSelectResult: (result: GlobalSearchResult) => void;
}

/**
 * Renders the lightweight global search overlay while delegating business data and navigation
 * decisions back to the app shell.
 */
export function GlobalSearchDialog({
  isOpen,
  query,
  results,
  activeIndex,
  onActiveIndexChange,
  onClose,
  onQueryChange,
  onSelectResult,
}: GlobalSearchDialogProps) {
  const activeResult =
    activeIndex >= 0 && activeIndex < results.length ? results[activeIndex] : null;

  if (!isOpen) {
    return null;
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      onActiveIndexChange(cycleGlobalSearchIndex(activeIndex, "next", results.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onActiveIndexChange(cycleGlobalSearchIndex(activeIndex, "previous", results.length));
      return;
    }

    if (event.key === "Enter" && activeResult) {
      event.preventDefault();
      onSelectResult(activeResult);
    }
  }

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && onClose()} open={isOpen}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search tasks, projects, and initiatives.
        </DialogDescription>

        <div className="p-3">
          <Input
            aria-label="Global search"
            autoFocus
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tasks, projects, and initiatives..."
            value={query}
          />
        </div>

        <Separator />

        <div className="max-h-[24rem] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="rounded-md px-3 py-6 text-sm text-[color:var(--muted)]">
              {query.trim()
                ? `No matches for "${query.trim()}".`
                : "No searchable items yet."}
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={`${result.entityType}-${result.id}`}>
                  <button
                    className={cn(
                      "w-full rounded-lg border px-3 py-3 text-left transition",
                      activeIndex === index
                        ? "border-[color:var(--foreground)] bg-[color:var(--surface-strong)]"
                        : "border-transparent hover:border-[color:var(--border)] hover:bg-[color:var(--surface-strong)]",
                    )}
                    onClick={() => onSelectResult(result)}
                    onMouseEnter={() => onActiveIndexChange(index)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[color:var(--foreground)]">
                          {result.title}
                        </p>
                        {result.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted)]">
                            {result.description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-[color:var(--muted)]">
                          {result.contextLabel}
                        </p>
                      </div>
                      <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[color:var(--muted-strong)]">
                        {readGlobalSearchEntityLabel(result.entityType)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        <div className="px-3 py-2 text-xs text-[color:var(--muted)]">
          Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to open, and <kbd>Esc</kbd>{" "}
          to close.
        </div>
      </DialogContent>
    </Dialog>
  );
}
