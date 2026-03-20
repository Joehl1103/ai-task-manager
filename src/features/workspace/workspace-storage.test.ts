import { describe, expect, it } from "vitest";

import { inboxProjectId, noProjectProjectId } from "@/features/workspace/projects";
import { normalizeWorkspaceSnapshot, workspaceStorageKey } from "@/features/workspace/storage";

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
   * Normalizes stored tasks and thread history so the UI can render partial saved data.
   */
  it("normalizes saved tasks and threads", () => {
    const workspace = normalizeWorkspaceSnapshot({
      initiatives: [
        {
          id: "initiative-1",
          name: "Launch",
          description: "Ship carefully",
          deadline: "",
          agentThread: {
            id: "custom-thread",
            messages: [
              {
                id: "message-custom",
                role: "human",
                content: "Summarize this initiative.",
                createdAt: "Today",
              },
            ],
          },
        },
      ],
      projects: [
        {
          id: "project-1",
          name: "Personal",
          initiativeId: "",
          deadline: "",
        },
      ],
      tasks: [
        {
          id: "task-custom",
          title: "Follow up with daycare",
          details: 123,
          projectId: "project-1",
          agentThread: {
            messages: [
              {
                id: "message-1",
                role: "agent",
                content: "Lead with empathy, ask for facts, and agree on a next check-in.",
                createdAt: "Today",
                providerId: "openai",
                model: "gpt-5",
                status: "done",
              },
              {
                id: "message-2",
                role: "weird",
                content: 5,
                createdAt: null,
                providerId: "unknown",
              },
            ],
          },
        },
      ],
    });

    expect(workspace.initiatives[0]?.agentThread.messages[0]).toMatchObject({
      id: "message-custom",
      role: "human",
      content: "Summarize this initiative.",
      createdAt: "Today",
    });
    expect(workspace.tasks[0]).toMatchObject({
      id: "task-custom",
      title: "Follow up with daycare",
      details: "",
      projectId: "project-1",
    });
    expect(workspace.tasks[0]?.agentThread.messages[0]).toMatchObject({
      id: "message-1",
      role: "agent",
      content: "Lead with empathy, ask for facts, and agree on a next check-in.",
      createdAt: "Today",
      providerId: "openai",
      model: "gpt-5",
      status: "done",
    });
    expect(workspace.tasks[0]?.agentThread.messages[1]).toMatchObject({
      id: "message-2",
      role: "human",
      content: "",
      createdAt: "Unknown time",
    });
  });

  /**
   * Migrates legacy task agent calls into conversational thread messages.
   */
  it("migrates legacy task agent calls into a task thread", () => {
    const workspace = normalizeWorkspaceSnapshot({
      initiatives: [],
      projects: [{ id: "project-1", name: "Personal", initiativeId: "", deadline: "" }],
      tasks: [
        {
          id: "task-custom",
          title: "Follow up with daycare",
          details: "",
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
          ],
        },
      ],
    });

    expect(workspace.tasks[0]?.agentThread.messages).toEqual([
      {
        id: "message-1",
        role: "human",
        content: "Draft three calm talking points.",
        createdAt: "Today",
      },
      {
        id: "message-2",
        role: "agent",
        content: "Lead with empathy, ask for facts, and agree on a next check-in.",
        createdAt: "Today",
        providerId: "openai",
        model: "gpt-5",
        status: "done",
      },
    ]);
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
        },
      ],
    });

    expect(workspace.tasks[0]).toMatchObject({
      id: "task-old",
      title: "Task without project",
      details: "Some details",
      projectId: inboxProjectId,
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
        },
      ],
    });

    expect(workspace.tasks[0]).toMatchObject({
      id: "task-old",
      title: "Task without tags",
      details: "Some details",
      projectId: inboxProjectId,
      tags: [],
    });
  });

  /**
   * Preserves the visible No Project project as a real project assignment.
   */
  it("preserves the no-project project id as a visible project", () => {
    const workspace = normalizeWorkspaceSnapshot({
      initiatives: [],
      projects: [
        {
          id: "project-no-project",
          name: "No Project",
          initiativeId: "",
          deadline: "",
        },
      ],
      tasks: [
        {
          id: "task-old",
          title: "Inbox task",
          details: "",
          projectId: "project-no-project",
        },
      ],
    });

    expect(workspace.projects.some((project) => project.id === inboxProjectId && project.name === "Inbox")).toBe(true);
    expect(workspace.projects.some((project) => project.id === noProjectProjectId && project.name === "No Project")).toBe(true);
    expect(workspace.tasks[0]).toMatchObject({
      projectId: noProjectProjectId,
    });
  });

  /**
   * Adds the visible No Project project when saved data only contains other projects.
   */
  it("ensures the visible no-project project exists", () => {
    const workspace = normalizeWorkspaceSnapshot({
      initiatives: [],
      projects: [
        {
          id: "project-1",
          name: "Relay MVP",
          initiativeId: "",
          deadline: "",
        },
      ],
      tasks: [],
    });

    expect(workspace.projects.some((project) => project.id === inboxProjectId && project.name === "Inbox")).toBe(true);
    expect(workspace.projects.some((project) => project.id === noProjectProjectId && project.name === "No Project")).toBe(true);
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
