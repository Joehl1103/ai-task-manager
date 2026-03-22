"use client";

import { useState } from "react";

import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Archive</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {completedTasks.length === 0
            ? "No completed tasks yet."
            : `${completedTasks.length} completed ${completedTasks.length === 1 ? "task" : "tasks"}`}
        </p>
      </header>

      {groups.length > 0 ? (
        <section className="space-y-4">
          {groups.map((group) => (
            <ArchiveDaySection
              group={group}
              key={group.dateKey}
              onToggleTaskCompleted={onToggleTaskCompleted}
              projects={projects}
            />
          ))}
        </section>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-32 items-center justify-center px-6 py-6 text-center text-sm text-[color:var(--muted)]">
            No completed tasks yet.
          </CardContent>
        </Card>
      )}
    </div>
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
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">{group.label}</CardTitle>
          <CardDescription>
            {group.tasks.length} completed {group.tasks.length === 1 ? "task" : "tasks"}
          </CardDescription>
        </div>

        <Button
          onClick={() => setIsExpanded((current) => !current)}
          size="sm"
          variant="ghost"
        >
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          {isExpanded ? "Hide tasks" : "Show tasks"}
        </Button>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="space-y-3">
          {group.tasks.map((task) => (
            <ArchiveTaskRow
              key={task.id}
              onToggleTaskCompleted={onToggleTaskCompleted}
              projects={projects}
              task={task}
            />
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}

interface ArchiveTaskRowProps {
  onToggleTaskCompleted: (taskId: string) => void;
  projects: Project[];
  task: Task;
}

/**
 * Shows a completed task row with its details and an un-complete action.
 */
function ArchiveTaskRow({
  onToggleTaskCompleted,
  projects,
  task,
}: ArchiveTaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const projectName = readProjectName(projects, task.projectId);
  const completionTime = formatCompletionTime(task.completedAt);

  return (
    <Card className="bg-[color:var(--background)] shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <Button
            aria-label="Mark incomplete"
            onClick={(event) => {
              event.stopPropagation();
              onToggleTaskCompleted(task.id);
            }}
            size="icon"
            variant="ghost"
          >
            <CheckCircle2
              aria-hidden="true"
              className="size-4 fill-[color:var(--border)] text-[color:var(--border-strong)]"
            />
          </Button>

          <button
            className={cn(
              "flex min-w-0 flex-1 flex-col items-start gap-2 text-left",
              "text-[color:var(--muted-strong)] hover:text-[color:var(--foreground)]",
            )}
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            <span className="text-sm font-medium line-through decoration-[color:var(--muted)]/40">
              {task.title}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {completionTime ? <Badge>{completionTime}</Badge> : null}
              {projectName ? <Badge variant="secondary">{`Project: ${projectName}`}</Badge> : null}
              {task.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </button>
        </div>

        {isExpanded ? (
          <div className="pl-12 text-sm text-[color:var(--muted-strong)]">
            {task.details ? <p className="whitespace-pre-wrap">{task.details}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
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
