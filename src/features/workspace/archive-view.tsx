"use client";

import { useState } from "react";

import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { type Project, type Task } from "@/features/workspace/core";
import { cn } from "@/lib/utils";

/**
 * Represents a group of tasks completed on the same calendar day.
 */
interface ArchiveDayGroup {
  label: string;
  dateKey: string;
  tasks: Task[];
}

interface ArchiveViewProps {
  completedTasks: Task[];
  projects: Project[];
  onToggleTaskCompleted: (taskId: string) => void;
}

/**
 * Renders completed tasks grouped by completion day, sorted most-recent-first.
 */
export function ArchiveView({
  completedTasks,
  projects,
  onToggleTaskCompleted,
}: ArchiveViewProps) {
  const groups = groupTasksByCompletionDay(completedTasks);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">Archive</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {completedTasks.length === 0
            ? "No completed tasks yet."
            : `${completedTasks.length} completed ${completedTasks.length === 1 ? "task" : "tasks"}`}
        </p>
      </header>

      {groups.length > 0 ? (
        <section className="mt-6 space-y-4">
          {groups.map((group) => (
            <ArchiveDaySection
              group={group}
              key={group.dateKey}
              onToggleTaskCompleted={onToggleTaskCompleted}
              projects={projects}
            />
          ))}
        </section>
      ) : null}
    </>
  );
}

interface ArchiveDaySectionProps {
  group: ArchiveDayGroup;
  onToggleTaskCompleted: (taskId: string) => void;
  projects: Project[];
}

/**
 * Renders one day group as a collapsible section with its completed tasks.
 */
function ArchiveDaySection({
  group,
  onToggleTaskCompleted,
  projects,
}: ArchiveDaySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section>
      <button
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setIsExpanded((current) => !current)}
        type="button"
      >
        {isExpanded ? (
          <ChevronDown className="size-3 text-[color:var(--muted)]" />
        ) : (
          <ChevronRight className="size-3 text-[color:var(--muted)]" />
        )}
        <h3 className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted-strong)]">
          {group.label}
          <span className="ml-2 text-[color:var(--muted)]">({group.tasks.length})</span>
        </h3>
      </button>

      {isExpanded ? (
        <ul className="mt-2">
          {group.tasks.map((task, index) => (
            <ArchiveTaskRow
              key={task.id}
              onToggleTaskCompleted={onToggleTaskCompleted}
              projects={projects}
              showsSeparator={index < group.tasks.length - 1}
              task={task}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

interface ArchiveTaskRowProps {
  onToggleTaskCompleted: (taskId: string) => void;
  projects: Project[];
  showsSeparator: boolean;
  task: Task;
}

/**
 * Shows a completed task row with its details and an un-complete action.
 */
function ArchiveTaskRow({
  onToggleTaskCompleted,
  projects,
  showsSeparator,
  task,
}: ArchiveTaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const projectName = readProjectName(projects, task.projectId);
  const completionTime = formatCompletionTime(task.completedAt);

  return (
    <li className="py-2">
      <div className="pl-[13px]">
        <div className="flex min-h-8 items-center gap-2">
          <button
            aria-label="Mark incomplete"
            className="shrink-0 transition-colors hover:text-[color:var(--foreground)]"
            onClick={(event) => {
              event.stopPropagation();
              onToggleTaskCompleted(task.id);
            }}
            type="button"
          >
            <CheckCircle2
              aria-hidden="true"
              className="size-4 fill-[color:var(--border)] text-[color:var(--border-strong)]"
            />
          </button>
          <button
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left",
              "text-[color:var(--muted-strong)] hover:text-[color:var(--foreground)]",
            )}
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            <span className="shrink truncate text-sm line-through decoration-[color:var(--muted)]/40">
              {task.title}
            </span>
          </button>
          {completionTime ? (
            <span className="shrink-0 text-xs text-[color:var(--muted)]">
              {completionTime}
            </span>
          ) : null}
        </div>

        {isExpanded ? (
          <div className="mt-2 ml-6 space-y-2 text-sm text-[color:var(--muted-strong)]">
            {task.details ? (
              <p className="whitespace-pre-wrap">{task.details}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
              {projectName ? <span>Project: {projectName}</span> : null}
              {task.tags.length > 0 ? (
                <span className="flex items-center gap-1">
                  {task.tags.map((tag) => (
                    <span
                      className="rounded-full bg-[#9ca3af] px-2 py-px text-xs font-medium leading-none text-white"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {showsSeparator ? <Separator className="mt-2" /> : null}
    </li>
  );
}

/**
 * Groups completed tasks by the day they were completed, sorted most-recent-first.
 * Within each day, tasks are sorted by completion time (most recent first).
 */
function groupTasksByCompletionDay(tasks: Task[]): ArchiveDayGroup[] {
  const sorted = [...tasks].sort((a, b) => {
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;

    return timeB - timeA;
  });

  const groupMap = new Map<string, Task[]>();

  for (const task of sorted) {
    const dateKey = task.completedAt
      ? extractDateKey(task.completedAt)
      : "unknown";
    const existing = groupMap.get(dateKey) ?? [];
    groupMap.set(dateKey, [...existing, task]);
  }

  return Array.from(groupMap.entries()).map(([dateKey, groupTasks]) => ({
    label: formatDateLabel(dateKey),
    dateKey,
    tasks: groupTasks,
  }));
}

/**
 * Extracts a YYYY-MM-DD date key from an ISO timestamp string.
 */
function extractDateKey(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);

    if (isNaN(date.getTime())) {
      return "unknown";
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  } catch {
    return "unknown";
  }
}

/**
 * Converts a date key into a human-readable label like "Today", "Yesterday", or a formatted date.
 */
function formatDateLabel(dateKey: string): string {
  if (dateKey === "unknown") {
    return "Unknown date";
  }

  const today = new Date();
  const todayKey = extractDateKey(today.toISOString());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = extractDateKey(yesterday.toISOString());

  if (dateKey === todayKey) {
    return "Today";
  }

  if (dateKey === yesterdayKey) {
    return "Yesterday";
  }

  try {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateKey;
  }
}

/**
 * Formats the time portion of a completion timestamp for display in the task row.
 */
function formatCompletionTime(completedAt: string): string | null {
  if (!completedAt) {
    return null;
  }

  try {
    const date = new Date(completedAt);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

/**
 * Reads the project name for display in the archive task detail.
 */
function readProjectName(projects: Project[], projectId: string): string | null {
  if (!projectId) {
    return null;
  }

  const project = projects.find((p) => p.id === projectId);

  return project?.name ?? null;
}
