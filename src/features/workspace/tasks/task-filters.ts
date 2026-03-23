import { type Task } from "@/features/workspace/core";

export type DateRangeFilter = "any" | "overdue" | "today" | "this-week" | "this-month";

export interface TaskFilters {
  projectId: string | null;
  dueBy: DateRangeFilter;
  remindOn: DateRangeFilter;
}

export const dateRangeFilters: DateRangeFilter[] = ["any", "overdue", "today", "this-week", "this-month"];

/**
 * Default filter state for the tasks view.
 */
export function createDefaultTaskFilters(): TaskFilters {
  return {
    projectId: null,
    dueBy: "any",
    remindOn: "any",
  };
}

/**
 * Normalizes a persisted filter object with defaults for malformed values.
 */
export function normalizeTaskFilters(value: unknown): TaskFilters {
  if (!isRecord(value)) {
    return createDefaultTaskFilters();
  }

  return {
    projectId: normalizeProjectId(value.projectId),
    dueBy: normalizeDateRangeFilter(value.dueBy),
    remindOn: normalizeDateRangeFilter(value.remindOn),
  };
}

/**
 * Filters tasks using AND semantics for all active filters.
 */
export function filterTasks(tasks: Task[], filters: TaskFilters, now: Date): Task[] {
  return tasks.filter((task) => {
    if (filters.projectId && task.projectId !== filters.projectId) {
      return false;
    }

    if (!matchesDateRange(task.dueBy, filters.dueBy, now)) {
      return false;
    }

    if (!matchesDateRange(task.remindOn, filters.remindOn, now)) {
      return false;
    }

    return true;
  });
}

/**
 * Returns true when a date string falls within the selected range.
 */
export function matchesDateRange(dateStr: string, range: DateRangeFilter, now: Date): boolean {
  if (range === "any") {
    return true;
  }

  const targetDate = parseIsoDate(dateStr);
  const normalizedNow = toUtcDateOnly(now);

  if (!targetDate) {
    return false;
  }

  if (range === "overdue") {
    return targetDate < normalizedNow;
  }

  if (range === "today") {
    return targetDate.getTime() === normalizedNow.getTime();
  }

  if (range === "this-week") {
    const endOfWeek = addDays(normalizedNow, 6);

    return targetDate >= normalizedNow && targetDate <= endOfWeek;
  }

  const month = normalizedNow.getUTCMonth();
  const year = normalizedNow.getUTCFullYear();

  return (
    targetDate >= normalizedNow &&
    targetDate.getUTCMonth() === month &&
    targetDate.getUTCFullYear() === year
  );
}

function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toUtcDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function normalizeDateRangeFilter(value: unknown): DateRangeFilter {
  if (typeof value !== "string") {
    return "any";
  }

  return dateRangeFilters.includes(value as DateRangeFilter) ? (value as DateRangeFilter) : "any";
}

function normalizeProjectId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
