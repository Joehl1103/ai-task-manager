"use client";

import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  type WorkspaceMenu,
  readWorkspaceMenuHint,
  readWorkspaceMenuLabel,
  workspaceMenus,
} from "./workspace-navigation";

interface WorkspaceTopMenuProps {
  activeMenu: WorkspaceMenu;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMenu: (menu: WorkspaceMenu) => void;
}

/**
 * Uses a stock shadcn dropdown-menu pattern for top-level workspace navigation.
 */
export function WorkspaceTopMenu({
  activeMenu,
  isOpen,
  onOpenChange,
  onSelectMenu,
}: WorkspaceTopMenuProps) {
  return (
    <section className="workspace-top-menu-shell">
      <DropdownMenu onOpenChange={onOpenChange} open={isOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Open workspace navigation"
            className="shrink-0 -ml-3"
            size="sm"
            variant="ghost"
          >
            <span className="text-sm">{readWorkspaceMenuLabel(activeMenu)}</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-150",
                isOpen ? "rotate-180" : "",
              )}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Navigate</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaceMenus.map((menu) => {
            const isActive = activeMenu === menu;

            return (
              <DropdownMenuItem
                className="items-start gap-3 py-2"
                key={menu}
                onSelect={() => onSelectMenu(menu)}
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  {isActive ? <Check className="size-4" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {readWorkspaceMenuLabel(menu)}
                  </span>
                  <span className="mt-1 block text-xs text-[color:var(--muted)]">
                    {readWorkspaceMenuHint(menu)}
                  </span>
                </span>
                {isActive ? <DropdownMenuShortcut>Current</DropdownMenuShortcut> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}
