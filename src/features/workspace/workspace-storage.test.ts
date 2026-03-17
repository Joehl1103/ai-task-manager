import { describe, expect, it } from "vitest";

import { normalizeWorkspaceSnapshot, workspaceStorageKey } from "./workspace-storage";

describe("workspace storage", () => {
  /**
   * Keeps the storage key stable so saved task data survives code changes.
   */
  it("uses a stable storage key", () => {
    expect(workspaceStorageKey).toBe("relay-workspace");
  });

  /**
   * Protects the app from malformed saved data by falling back to the seed workspace.
   */
  it("falls back when saved workspace data is invalid", () => {
    const workspace = normalizeWorkspaceSnapshot("not-json-shape");

    expect(workspace.tasks).toHaveLength(3);
    expect(workspace.tasks[0]?.title).toBe("Define the smallest possible task manager");
  });

  /**
   * Preserves an intentionally empty task list instead of restoring the seed tasks.
   */
  it("keeps an empty saved task list", () => {
    const workspace = normalizeWorkspaceSnapshot({
      tasks: [],
    });

    expect(workspace.tasks).toEqual([]);
  });

  /**
   * Normalizes stored tasks and agent history so the UI can render partial saved data.
   */
  it("normalizes saved tasks and agent calls", () => {
    const workspace = normalizeWorkspaceSnapshot({
      initiatives: [],
      projects: [{ id: "project-1", name: "Personal", initiativeId: "", deadline: "" }],
      tasks: [
        {
          id: "task-custom",
          title: "Follow up with daycare",
          details: 123,
          projectId: "project-1",
          agentCalls: [
            {
              id: "call-custom",
              providerId: "openai",
              model: "gpt-5",
              brief: "Draft three calm talking points.",
              status: "done",
              createdAt: "Today",
              result: "Lead with empathy, ask for facts, and agree on a next check-in.",
            },
            {
              id: "call-bad",
              providerId: "unknown",
              model: "",
              brief: 5,
              status: "weird",
              createdAt: null,
            },
          ],
        },
      ],
    });

    expect(workspace.tasks[0]).toMatchObject({
      id: "task-custom",
      title: "Follow up with daycare",
      details: "",
      projectId: "project-1",
    });
    expect(workspace.tasks[0]?.agentCalls[0]).toMatchObject({
      id: "call-custom",
      providerId: "openai",
      model: "gpt-5",
      brief: "Draft three calm talking points.",
      status: "done",
      createdAt: "Today",
      result: "Lead with empathy, ask for facts, and agree on a next check-in.",
    });
    expect(workspace.tasks[0]?.agentCalls[1]).toMatchObject({
      id: "call-bad",
      providerId: "openai",
      model: "Unknown model",
      brief: "",
      status: "error",
      createdAt: "Unknown time",
    });
  });

  /**
   * Normalizes tasks without a projectId field to an empty string.
   */
  it("normalizes tasks without a projectId field", () => {
    const workspace = normalizeWorkspaceSnapshot({
      initiatives: [],
      projects: [],
      tasks: [
        {
          id: "task-old",
          title: "Task without project",
          details: "Some details",
          agentCalls: [],
        },
      ],
    });

    expect(workspace.tasks[0]).toMatchObject({
      id: "task-old",
      title: "Task without project",
      details: "Some details",
      projectId: "",
    });
  });

  /**
   * Normalizes tasks without a tags field to an empty array.
   */
  it("normalizes tasks without a tags field", () => {
    const workspace = normalizeWorkspaceSnapshot({
      initiatives: [],
      projects: [],
      tasks: [
        {
          id: "task-old",
          title: "Task without tags",
          details: "Some details",
          projectId: "",
          agentCalls: [],
        },
      ],
    });

    expect(workspace.tasks[0]).toMatchObject({
      id: "task-old",
      title: "Task without tags",
      details: "Some details",
      projectId: "",
      tags: [],
    });
  });

  /**
   * Normalizes tasks with tags, filtering out invalid entries.
   */
  it("normalizes tasks with tags", () => {
    const workspace = normalizeWorkspaceSnapshot({
      tasks: [
        {
          id: "task-with-tags",
          title: "Task with tags",
          details: "Some details",
          project: "Project",
          tags: ["work", "priority", 123, null, "", "   "],
          agentCalls: [],
        },
      ],
    });

    expect(workspace.tasks[0]).toMatchObject({
      id: "task-with-tags",
      title: "Task with tags",
      tags: ["work", "priority"],
    });
  });
});
