"use client";

import { type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TaskOverviewActionsMenuProps {
  onDeleteTask: () => void;
  onOpenTask: () => void;
}

/**
 * Keeps per-row task actions available without forcing every overview line into a button cluster.
 */
export function TaskOverviewActionsMenu({
  onDeleteTask,
  onOpenTask,
}: TaskOverviewActionsMenuProps) {
  return (
    <TaskActionsMenuTrigger label="Task actions">
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpenTask}>Open task</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-600 focus:text-rose-700"
          onSelect={onDeleteTask}
        >
          Remove task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </TaskActionsMenuTrigger>
  );
}

interface TaskDetailActionsMenuProps {
  isEditing: boolean;
  onDeleteTask: () => void;
  onStartEdit: () => void;
}

/**
 * Keeps the task drill-down header quiet by collapsing edit and delete into one compact menu.
 */
export function TaskDetailActionsMenu({
  isEditing,
  onDeleteTask,
  onStartEdit,
}: TaskDetailActionsMenuProps) {
  return (
    <TaskActionsMenuTrigger label="Task actions" triggerClassName="shrink-0">
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={isEditing} onSelect={onStartEdit}>
          {isEditing ? "Editing" : "Edit task"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-600 focus:text-rose-700"
          onSelect={onDeleteTask}
        >
          Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </TaskActionsMenuTrigger>
  );
}

interface TaskActionsMenuTriggerProps {
  children: ReactNode;
  label: string;
  triggerClassName?: string;
}

function TaskActionsMenuTrigger({
  children,
  label,
  triggerClassName,
}: TaskActionsMenuTriggerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={label}
          className={cn(
            "text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]",
            triggerClassName,
          )}
          size="icon"
          variant="ghost"
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      {children}
    </DropdownMenu>
  );
}
