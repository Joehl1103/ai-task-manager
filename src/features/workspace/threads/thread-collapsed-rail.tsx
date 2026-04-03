"use client";

import { MessageCircle } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ThreadCollapsedRailProps {
  onExpand: () => void;
}

/**
 * Narrow rail shown when the thread panel has been opened and then closed.
 * Mirrors the left sidebar's WorkspaceCollapsedRail so both edges behave the same way.
 */
export function ThreadCollapsedRail({ onExpand }: ThreadCollapsedRailProps) {
  return (
    <TooltipProvider>
      <aside
        aria-label="Collapsed thread panel"
        className="flex h-full w-8 shrink-0 border-l border-[color:var(--row-divider)]"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Expand thread panel"
              className={cn(
                "flex h-12 w-full items-center justify-center text-[color:var(--muted)] transition-colors",
                "hover:bg-[color:var(--row-hover)] hover:text-[color:var(--foreground)]",
              )}
              onClick={onExpand}
              type="button"
            >
              <MessageCircle className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Expand thread panel</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
