import { describe, expect, it } from "vitest";

import { type Task } from "@/features/workspace/core";
import { createAgentThread } from "@/features/workspace/threads";

import {
  createDefaultTaskFilters,
  filterTasks,
  matchesDateRange,
  type TaskFilters,
} from "./task-filters";

function createTask(
  id: string,
  projectId: string,
  dueBy: string,
  remindOn: string,
): Task {
  return {
    id,
    title: `Task ${id}`,
    details: "",
    completed: false,
    projectId,
    dueBy,
    remindOn,
    tags: [],
    createdAt: "2026-03-23T10:00:00.000Z",
    completedAt: "",
    agentThread: createAgentThread("task", id),
  };
}

function createFilters(overrides: Partial<TaskFilters> = {}): TaskFilters {
  return {
    ...createDefaultTaskFilters(),
    ...overrides,
  };
}

describe("task filters", () => {
  const now = new Date("2026-03-23T12:00:00.000Z");
  const tasks = [
    createTask("task-1", "project-1", "2026-03-22", "2026-03-21"),
    createTask("task-2", "project-1", "2026-03-23", "2026-03-23"),
    createTask("task-3", "project-2", "2026-03-25", "2026-03-27"),
    createTask("task-4", "project-2", "2026-03-30", "2026-03-31"),
    createTask("task-5", "project-2", "2026-04-02", ""),
    createTask("task-6", "project-3", "", ""),
  ];

  it("returns all tasks for the default filters", () => {
    expect(filterTasks(tasks, createDefaultTaskFilters(), now).map((task) => task.id)).toEqual([
      "task-1",
      "task-2",
      "task-3",
      "task-4",
      "task-5",
      "task-6",
    ]);
  });

  it("filters by project id", () => {
    expect(filterTasks(tasks, createFilters({ projectId: "project-1" }), now).map((task) => task.id)).toEqual([
      "task-1",
      "task-2",
    ]);
  });

  it("filters by due-by date range", () => {
    expect(filterTasks(tasks, createFilters({ dueBy: "overdue" }), now).map((task) => task.id)).toEqual([
      "task-1",
    ]);
    expect(filterTasks(tasks, createFilters({ dueBy: "today" }), now).map((task) => task.id)).toEqual([
      "task-2",
    ]);
    expect(filterTasks(tasks, createFilters({ dueBy: "this-week" }), now).map((task) => task.id)).toEqual([
      "task-2",
      "task-3",
    ]);
    expect(filterTasks(tasks, createFilters({ dueBy: "this-month" }), now).map((task) => task.id)).toEqual([
      "task-2",
      "task-3",
      "task-4",
    ]);
  });

  it("filters by remind-on date range", () => {
    expect(filterTasks(tasks, createFilters({ remindOn: "overdue" }), now).map((task) => task.id)).toEqual([
      "task-1",
    ]);
    expect(filterTasks(tasks, createFilters({ remindOn: "today" }), now).map((task) => task.id)).toEqual([
      "task-2",
    ]);
    expect(filterTasks(tasks, createFilters({ remindOn: "this-week" }), now).map((task) => task.id)).toEqual([
      "task-2",
      "task-3",
    ]);
  });

  it("AND-combines active filters", () => {
    expect(
      filterTasks(
        tasks,
        createFilters({
          projectId: "project-2",
          dueBy: "this-week",
          remindOn: "this-week",
        }),
        now,
      ).map((task) => task.id),
    ).toEqual(["task-3"]);
  });
});

describe("date range matching", () => {
  const now = new Date("2026-03-23T09:00:00.000Z");

  it("handles empty or invalid values", () => {
    expect(matchesDateRange("", "today", now)).toBe(false);
    expect(matchesDateRange("not-a-date", "today", now)).toBe(false);
  });

  it("always matches for any range", () => {
    expect(matchesDateRange("", "any", now)).toBe(true);
    expect(matchesDateRange("2026-03-23", "any", now)).toBe(true);
  });
});
