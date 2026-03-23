import { type Task } from "@/features/workspace/core";

export interface DateBadge {
  label: string;
  tone: string;
}

/**
 * Builds optional date badges for a task's dueBy and remindOn fields.
 */
export function readDateBadges(task: Task): DateBadge[] {
  const dateBadges: DateBadge[] = [];
  const remindOnBadge = buildDateBadge(task.remindOn, "Remind on");
  const dueByBadge = buildDateBadge(task.dueBy, "Due by");

  if (remindOnBadge) {
    dateBadges.push(remindOnBadge);
  }

  if (dueByBadge) {
    dateBadges.push(dueByBadge);
  }

  return dateBadges;
}

/**
 * Formats a date value into a compact badge with colour-coded urgency.
 */
export function buildDateBadge(value: string, prefix: string): DateBadge | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const date = new Date(`${trimmedValue}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const label = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const tone = date < today ? "text-rose-600" : date <= tomorrow ? "text-amber-600" : "text-[color:var(--muted)]";

  return {
    label: `${prefix} ${label}`,
    tone,
  };
}
