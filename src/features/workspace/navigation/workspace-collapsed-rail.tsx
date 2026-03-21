"use client";

import { PanelLeftOpen } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WorkspaceCollapsedRailProps {
  onExpand: () => void;
}

/**
 * Keeps sidebar recovery pinned to the far left edge when the full navigation is hidden.
 */
export function WorkspaceCollapsedRail({ onExpand }: WorkspaceCollapsedRailProps) {
  return (
    <TooltipProvider>
      <aside
        aria-label="Collapsed workspace sidebar"
        className="workspace-collapsed-rail flex h-full w-8 shrink-0 border-r border-[color:var(--row-divider)]"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Expand sidebar"
              className={cn(
                "flex h-12 w-full items-center justify-center text-[color:var(--muted)] transition-colors",
                "hover:bg-[color:var(--row-hover)] hover:text-[color:var(--foreground)]",
              )}
              onClick={onExpand}
              type="button"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
