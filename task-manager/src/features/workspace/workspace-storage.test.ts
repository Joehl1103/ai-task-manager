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

    expect(workspace.tasks).toHaveLength(2);
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
      tasks: [
        {
          id: "task-custom",
          title: "Follow up with daycare",
          project: "Family admin",
          details: 123,
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
      project: "Family admin",
      details: "",
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
   * Keeps older saved tasks visible by defaulting the new project field to a blank value.
   */
  it("defaults missing project data to an empty string", () => {
    const workspace = normalizeWorkspaceSnapshot({
      tasks: [
        {
          id: "task-custom",
          title: "Follow up with daycare",
          details: "Ask about the new pickup flow.",
          agentCalls: [],
        },
      ],
    });

    expect(workspace.tasks[0]?.project).toBe("");
  });
});
