"use client";

import { PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarRail } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkspaceCollapsedRailProps {
  onExpand: () => void;
}

/**
 * Keeps sidebar recovery pinned to the far left edge when the full navigation is hidden.
 */
export function WorkspaceCollapsedRail({ onExpand }: WorkspaceCollapsedRailProps) {
  return (
    <TooltipProvider>
      <SidebarRail
        aria-label="Collapsed workspace sidebar"
        className="workspace-collapsed-rail"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Expand sidebar"
              className="h-12 w-full rounded-none text-[color:var(--muted)]"
              onClick={onExpand}
              size="icon"
              variant="ghost"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
      </SidebarRail>
    </TooltipProvider>
  );
}
