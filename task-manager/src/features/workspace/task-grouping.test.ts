import { describe, expect, it } from "vitest";

import {
  countGroupedTasks,
  groupTasksByProject,
  noProjectLabel,
} from "./task-grouping";
import { type Task } from "./types";

function createTask(id: string, title: string, project: string): Task {
  return {
    id,
    title,
    details: "",
    project,
    agentCalls: [],
  };
}

describe("task grouping", () => {
  it("groups tasks by project", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", "Project Alpha"),
      createTask("task-2", "Task B", "Project Beta"),
      createTask("task-3", "Task C", "Project Alpha"),
    ];

    const groups = groupTasksByProject(tasks);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("Project Alpha");
    expect(groups[0]?.tasks).toHaveLength(2);
    expect(groups[1]?.label).toBe("Project Beta");
    expect(groups[1]?.tasks).toHaveLength(1);
  });

  it("preserves task order within each group", () => {
    const tasks: Task[] = [
      createTask("task-1", "First", "Project Alpha"),
      createTask("task-2", "Second", "Project Alpha"),
      createTask("task-3", "Third", "Project Alpha"),
    ];

    const groups = groupTasksByProject(tasks);

    expect(groups[0]?.tasks[0]?.title).toBe("First");
    expect(groups[0]?.tasks[1]?.title).toBe("Second");
    expect(groups[0]?.tasks[2]?.title).toBe("Third");
  });

  it("collects tasks without a project into a fallback group", () => {
    const tasks: Task[] = [
      createTask("task-1", "With project", "Project Alpha"),
      createTask("task-2", "No project", ""),
      createTask("task-3", "Also no project", ""),
    ];

    const groups = groupTasksByProject(tasks);

    expect(groups).toHaveLength(2);
    expect(groups[1]?.label).toBe(noProjectLabel);
    expect(groups[1]?.project).toBe("");
    expect(groups[1]?.tasks).toHaveLength(2);
  });

  it("places the no-project group at the end", () => {
    const tasks: Task[] = [
      createTask("task-1", "No project first", ""),
      createTask("task-2", "With project", "Project Alpha"),
    ];

    const groups = groupTasksByProject(tasks);

    expect(groups[0]?.label).toBe("Project Alpha");
    expect(groups[1]?.label).toBe(noProjectLabel);
  });

  it("trims whitespace-only project names into the no-project group", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", "Project Alpha"),
      createTask("task-2", "Task B", "   "),
    ];

    const groups = groupTasksByProject(tasks);

    expect(groups[0]?.label).toBe("Project Alpha");
    expect(groups[1]?.label).toBe(noProjectLabel);
  });

  it("returns an empty array when there are no tasks", () => {
    const groups = groupTasksByProject([]);

    expect(groups).toEqual([]);
  });

  it("handles all tasks having no project", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", ""),
      createTask("task-2", "Task B", ""),
    ];

    const groups = groupTasksByProject(tasks);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe(noProjectLabel);
    expect(groups[0]?.tasks).toHaveLength(2);
  });

  it("counts total tasks across all groups", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", "Project Alpha"),
      createTask("task-2", "Task B", "Project Beta"),
      createTask("task-3", "Task C", ""),
    ];

    const groups = groupTasksByProject(tasks);
    const count = countGroupedTasks(groups);

    expect(count).toBe(3);
  });
});
