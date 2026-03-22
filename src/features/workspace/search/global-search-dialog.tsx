"use client";

import { type KeyboardEvent } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

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

        <Command>
          <CommandInput
            aria-label="Global search"
            autoFocus
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tasks, projects, and initiatives..."
            value={query}
          />

          <CommandList>
            {results.length === 0 ? (
              <CommandEmpty>
                {query.trim()
                  ? `No matches for "${query.trim()}".`
                  : "No searchable items yet."}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Results">
                {results.map((result, index) => (
                  <CommandItem
                    key={`${result.entityType}-${result.id}`}
                    onClick={() => onSelectResult(result)}
                    onMouseEnter={() => onActiveIndexChange(index)}
                    selected={activeIndex === index}
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
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>

          <CommandSeparator />

          <div className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs text-[color:var(--muted)]">
            <span>Use</span>
            <CommandShortcut>↑</CommandShortcut>
            <CommandShortcut>↓</CommandShortcut>
            <span>to navigate,</span>
            <CommandShortcut>Enter</CommandShortcut>
            <span>to open, and</span>
            <CommandShortcut>Esc</CommandShortcut>
            <span>to close.</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
