"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  type WorkspaceView,
  readWorkspaceViewLabel,
  workspaceViews,
} from "./workspace-navigation";

interface WorkspaceTopMenuProps {
  activeView: WorkspaceView;
  isExpanded: boolean;
  onSelectView: (view: WorkspaceView) => void;
  onToggleMenu: () => void;
}

/**
 * Renders a slim desktop top menu that keeps navigation tucked away until it is needed.
 */
export function WorkspaceTopMenu({
  activeView,
  isExpanded,
  onSelectView,
  onToggleMenu,
}: WorkspaceTopMenuProps) {
  return (
    <section className="workspace-top-menu-shell pb-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-[color:var(--muted)]">{readWorkspaceViewLabel(activeView)}</p>

        <Button
          aria-expanded={isExpanded}
          className="shrink-0"
          onClick={onToggleMenu}
          size="sm"
          variant="ghost"
        >
          <Menu className="size-4" />
          Views
        </Button>
      </div>

      {isExpanded ? (
        <nav aria-label="Workspace views" className="mt-2 flex flex-wrap gap-3 text-sm">
          {workspaceViews.map((view) => {
            const isActive = activeView === view;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-left transition-colors",
                  isActive
                    ? "font-medium text-[color:var(--foreground)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                )}
                key={view}
                onClick={() => onSelectView(view)}
                type="button"
              >
                {readWorkspaceViewLabel(view)}
              </button>
            );
          })}
        </nav>
      ) : null}
    </section>
  );
}
