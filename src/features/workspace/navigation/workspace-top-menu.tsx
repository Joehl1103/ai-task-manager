"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  type WorkspaceMenu,
  readWorkspaceMenuLabel,
  workspaceMenus,
} from "./workspace-navigation";

interface WorkspaceTopMenuProps {
  activeMenu: WorkspaceMenu;
  isExpanded: boolean;
  onSelectMenu: (menu: WorkspaceMenu) => void;
  onToggleMenu: () => void;
}

/**
 * Renders a slim desktop top menu that opens from the current-view label.
 */
export function WorkspaceTopMenu({
  activeMenu,
  isExpanded,
  onSelectMenu,
  onToggleMenu,
}: WorkspaceTopMenuProps) {
  return (
    <section className="workspace-top-menu-shell pb-2">
      <div className="flex items-center gap-3 text-sm">
        <Button
          aria-controls="workspace-top-menu"
          aria-expanded={isExpanded}
          aria-haspopup="true"
          className="shrink-0 -ml-3 transition-all duration-150 hover:opacity-80 active:scale-95"
          onClick={onToggleMenu}
          size="sm"
          variant="ghost"
        >
          <span className="text-sm">{readWorkspaceMenuLabel(activeMenu)}</span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-150",
              isExpanded ? "rotate-180" : "",
            )}
          />
        </Button>
      </div>

      {isExpanded ? (
        <nav
          aria-label="Workspace menu"
          className="mt-2 flex flex-wrap gap-3 text-sm"
          id="workspace-top-menu"
        >
          {workspaceMenus.map((menu) => {
            const isActive = activeMenu === menu;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-left transition-all duration-150 cursor-pointer active:opacity-70",
                  isActive
                    ? "font-medium text-[color:var(--foreground)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                )}
                key={menu}
                onClick={() => onSelectMenu(menu)}
                type="button"
              >
                {readWorkspaceMenuLabel(menu)}
              </button>
            );
          })}
        </nav>
      ) : null}
    </section>
  );
}
