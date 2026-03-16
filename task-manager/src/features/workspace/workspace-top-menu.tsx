"use client";

import { Menu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  type WorkspaceView,
  readWorkspaceViewHint,
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
    <section className="workspace-top-menu-shell border-b border-[color:var(--border)] px-1 pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Relay workspace
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{readWorkspaceViewLabel(activeView)}</p>
            <Badge variant={activeView === "tasks" ? "accent" : "neutral"}>
              {readWorkspaceViewHint(activeView)}
            </Badge>
          </div>
        </div>

        <Button
          aria-expanded={isExpanded}
          className="shrink-0"
          onClick={onToggleMenu}
          size="sm"
          variant={isExpanded ? "subtle" : "ghost"}
        >
          <Menu className="size-4" />
          Menu
        </Button>
      </div>

      {isExpanded ? (
        <nav
          aria-label="Workspace views"
          className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--border)] pt-3"
        >
          {workspaceViews.map((view) => {
            const isActive = activeView === view;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--foreground)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-strong)] hover:bg-[color:var(--surface)]",
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
