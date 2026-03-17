"use client";

import { Menu } from "lucide-react";

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
 * Renders a slim desktop top menu that keeps navigation tucked away until it is needed.
 */
export function WorkspaceTopMenu({
  activeMenu,
  isExpanded,
  onSelectMenu,
  onToggleMenu,
}: WorkspaceTopMenuProps) {
  return (
    <section className="workspace-top-menu-shell pb-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-[color:var(--muted)]">{readWorkspaceMenuLabel(activeMenu)}</p>

        <Button
          aria-expanded={isExpanded}
          className="shrink-0 transition-all duration-150 hover:opacity-80 active:scale-95"
          onClick={onToggleMenu}
          size="sm"
          variant="ghost"
        >
          <Menu className="size-4" />
          Menu
        </Button>
      </div>

      {isExpanded ? (
        <nav aria-label="Workspace menu" className="mt-2 flex flex-wrap gap-3 text-sm">
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
