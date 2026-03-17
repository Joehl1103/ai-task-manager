import { describe, expect, it } from "vitest";

import {
  countGroupedTasks,
  groupTasksByProject,
  groupTasksByTag,
  noProjectLabel,
  noTagsLabel,
} from "./task-grouping";
import { type Task } from "./types";

function createTask(
  id: string,
  title: string,
  project: string,
  tags: string[] = [],
): Task {
  return {
    id,
    title,
    details: "",
    project,
    tags,
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

describe("tag grouping", () => {
  it("groups tasks by tag", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", "Project Alpha", ["work", "urgent"]),
      createTask("task-2", "Task B", "Project Beta", ["work"]),
      createTask("task-3", "Task C", "", ["personal"]),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups).toHaveLength(3);
    expect(groups[0]?.label).toBe("personal");
    expect(groups[1]?.label).toBe("urgent");
    expect(groups[2]?.label).toBe("work");
  });

  it("sorts tags alphabetically", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", "", ["zebra"]),
      createTask("task-2", "Task B", "", ["apple"]),
      createTask("task-3", "Task C", "", ["mango"]),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups[0]?.label).toBe("apple");
    expect(groups[1]?.label).toBe("mango");
    expect(groups[2]?.label).toBe("zebra");
  });

  it("places a task in multiple tag groups if it has multiple tags", () => {
    const tasks: Task[] = [
      createTask("task-1", "Multi-tag task", "", ["work", "urgent", "project-x"]),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups).toHaveLength(3);
    expect(groups[0]?.label).toBe("project-x");
    expect(groups[0]?.tasks).toHaveLength(1);
    expect(groups[0]?.tasks[0]?.id).toBe("task-1");

    expect(groups[1]?.label).toBe("urgent");
    expect(groups[1]?.tasks).toHaveLength(1);
    expect(groups[1]?.tasks[0]?.id).toBe("task-1");

    expect(groups[2]?.label).toBe("work");
    expect(groups[2]?.tasks).toHaveLength(1);
    expect(groups[2]?.tasks[0]?.id).toBe("task-1");
  });

  it("collects tasks without tags into a fallback group", () => {
    const tasks: Task[] = [
      createTask("task-1", "With tags", "", ["work"]),
      createTask("task-2", "No tags", ""),
      createTask("task-3", "Also no tags", ""),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups).toHaveLength(2);
    expect(groups[1]?.label).toBe(noTagsLabel);
    expect(groups[1]?.project).toBe("");
    expect(groups[1]?.tasks).toHaveLength(2);
  });

  it("places the no-tags group at the end", () => {
    const tasks: Task[] = [
      createTask("task-1", "No tags first", ""),
      createTask("task-2", "With tags", "", ["work"]),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups[0]?.label).toBe("work");
    expect(groups[1]?.label).toBe(noTagsLabel);
  });

  it("preserves task order within each tag group", () => {
    const tasks: Task[] = [
      createTask("task-1", "First", "", ["work"]),
      createTask("task-2", "Second", "", ["work"]),
      createTask("task-3", "Third", "", ["work"]),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups[0]?.tasks[0]?.title).toBe("First");
    expect(groups[0]?.tasks[1]?.title).toBe("Second");
    expect(groups[0]?.tasks[2]?.title).toBe("Third");
  });

  it("returns an empty array when there are no tasks", () => {
    const groups = groupTasksByTag([]);

    expect(groups).toEqual([]);
  });

  it("handles all tasks having no tags", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", ""),
      createTask("task-2", "Task B", ""),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe(noTagsLabel);
    expect(groups[0]?.tasks).toHaveLength(2);
  });

  it("counts total task occurrences across all groups (including duplicates)", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", "", ["work", "urgent"]),
      createTask("task-2", "Task B", "", ["work"]),
      createTask("task-3", "Task C", ""),
    ];

    const groups = groupTasksByTag(tasks);
    const count = countGroupedTasks(groups);

    expect(count).toBe(4);
  });

  it("trims whitespace from tags before grouping", () => {
    const tasks: Task[] = [
      createTask("task-1", "Task A", "", ["  work  "]),
      createTask("task-2", "Task B", "", ["work"]),
    ];

    const groups = groupTasksByTag(tasks);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("work");
    expect(groups[0]?.tasks).toHaveLength(2);
  });
});
