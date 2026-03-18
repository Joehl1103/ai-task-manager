import { describe, expect, it } from "vitest";

import { workspaceSeed } from "./mock-data";
import {
  addTask,
  appendAgentThreadMessage,
  appendHumanThreadMessage,
  deleteTask,
  deleteThreadMessage,
  updateTask,
} from "./operations";

describe("workspace operations", () => {
  /**
   * Ensures the app can create a new task from a bare minimum title.
   */
  it("adds a new task to the single task container", () => {
    const updatedWorkspace = addTask(workspaceSeed, {
      title: "Write Monday priorities",
      details: "Keep it short and practical.",
    });

    expect(updatedWorkspace.tasks).toHaveLength(workspaceSeed.tasks.length + 1);
    expect(updatedWorkspace.tasks[0]).toMatchObject({
      title: "Write Monday priorities",
      details: "Keep it short and practical.",
      projectId: "",
    });
    expect(updatedWorkspace.tasks[0]?.agentThread.messages).toEqual([]);
  });

  /**
   * Creates a task with a project assignment.
   */
  it("adds a task with a project", () => {
    const updatedWorkspace = addTask(workspaceSeed, {
      title: "Review sprint goals",
      details: "Check alignment with Q1 objectives.",
      projectId: "project-1",
    });

    expect(updatedWorkspace.tasks[0]).toMatchObject({
      title: "Review sprint goals",
      details: "Check alignment with Q1 objectives.",
      projectId: "project-1",
    });
  });

  /**
   * Creates a task with tags.
   */
  it("adds a task with tags", () => {
    const updatedWorkspace = addTask(workspaceSeed, {
      title: "Review sprint goals",
      details: "Check alignment with Q1 objectives.",
      tags: ["planning", "review"],
    });

    expect(updatedWorkspace.tasks[0]).toMatchObject({
      title: "Review sprint goals",
      tags: ["planning", "review"],
    });
  });

  /**
   * Removes duplicate tags case-insensitively.
   */
  it("normalizes duplicate tags case-insensitively", () => {
    const updatedWorkspace = addTask(workspaceSeed, {
      title: "Test task",
      details: "",
      tags: ["work", "Work", "WORK", "planning"],
    });

    expect(updatedWorkspace.tasks[0].tags).toEqual(["work", "planning"]);
  });

  /**
   * Filters out empty tags.
   */
  it("removes empty tags", () => {
    const updatedWorkspace = addTask(workspaceSeed, {
      title: "Test task",
      details: "",
      tags: ["", "work", "  ", "planning"],
    });

    expect(updatedWorkspace.tasks[0].tags).toEqual(["work", "planning"]);
  });

  /**
   * Trims whitespace from tags.
   */
  it("trims whitespace from tags", () => {
    const updatedWorkspace = addTask(workspaceSeed, {
      title: "Test task",
      details: "",
      tags: ["  work  ", "planning "],
    });

    expect(updatedWorkspace.tasks[0].tags).toEqual(["work", "planning"]);
  });

  /**
   * Keeps editing behavior explicit by replacing the task title and details in one step.
   */
  it("updates an existing task", () => {
    const updatedWorkspace = updateTask(workspaceSeed, {
      taskId: "task-1",
      title: "Tighten the starter task manager",
      details: "Only keep the features needed for a first pass.",
    });

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")).toMatchObject({
      title: "Tighten the starter task manager",
      details: "Only keep the features needed for a first pass.",
    });
  });

  /**
   * Updates a task's project while preserving other fields.
   */
  it("updates a task project", () => {
    const updatedWorkspace = updateTask(workspaceSeed, {
      taskId: "task-1",
      title: "Define the smallest possible task manager",
      details: "Keep only create, edit, delete, and call-agent actions.",
      projectId: "project-2",
    });

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")).toMatchObject({
      projectId: "project-2",
    });
  });

  /**
   * Preserves the existing project when not explicitly updated.
   */
  it("preserves existing project when not provided in update", () => {
    const updatedWorkspace = updateTask(workspaceSeed, {
      taskId: "task-1",
      title: "Updated title",
      details: "Updated details",
    });

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")).toMatchObject({
      projectId: "project-1",
    });
  });

  /**
   * Updates a task's tags while preserving other fields.
   */
  it("updates a task tags", () => {
    const updatedWorkspace = updateTask(workspaceSeed, {
      taskId: "task-1",
      title: "Define the smallest possible task manager",
      details: "Keep only create, edit, delete, and call-agent actions.",
      tags: ["ui", "feature"],
    });

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")).toMatchObject({
      tags: ["ui", "feature"],
    });
  });

  /**
   * Preserves the existing tags when not provided in update.
   */
  it("preserves existing tags when not provided in update", () => {
    const updatedWorkspace = updateTask(workspaceSeed, {
      taskId: "task-1",
      title: "Updated title",
      details: "Updated details",
    });

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")).toMatchObject({
      tags: ["planning", "design"],
    });
  });

  /**
   * Verifies that delete removes the task entirely instead of only hiding it.
   */
  it("deletes a task", () => {
    const updatedWorkspace = deleteTask(workspaceSeed, "task-2");

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-2")).toBeUndefined();
    expect(updatedWorkspace.tasks).toHaveLength(workspaceSeed.tasks.length - 1);
  });

  /**
   * Appends a new human message to a task thread.
   */
  it("adds a human message to a task thread", () => {
    const updatedWorkspace = appendHumanThreadMessage(workspaceSeed, {
      owner: {
        ownerType: "task",
        ownerId: "task-1",
      },
      content: "Suggest a sharper problem statement.",
      now: "Later",
    });

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")?.agentThread.messages.at(-1)).toMatchObject({
      role: "human",
      content: "Suggest a sharper problem statement.",
      createdAt: "Later",
    });
  });

  /**
   * Appends an agent response to a project thread.
   */
  it("adds an agent reply to a project thread", () => {
    const updatedWorkspace = appendAgentThreadMessage(workspaceSeed, {
      owner: {
        ownerType: "project",
        ownerId: "project-1",
      },
      providerId: "openai",
      model: "gpt-5",
      content: "Start with scope, user flow, and one clear success metric.",
      now: "Now",
      status: "done",
    });

    expect(updatedWorkspace.projects.find((project) => project.id === "project-1")?.agentThread.messages.at(-1)).toMatchObject({
      role: "agent",
      content: "Start with scope, user flow, and one clear success metric.",
      providerId: "openai",
      model: "gpt-5",
      status: "done",
      createdAt: "Now",
    });
  });

  /**
   * Keeps thread updates scoped so one initiative thread never edits another entity.
   */
  it("only edits the requested owner thread", () => {
    const updatedWorkspace = appendHumanThreadMessage(workspaceSeed, {
      owner: {
        ownerType: "initiative",
        ownerId: "initiative-1",
      },
      content: "Outline the next launch checkpoint.",
      now: "Today",
    });

    expect(updatedWorkspace.initiatives[0]?.agentThread.messages).toHaveLength(
      workspaceSeed.initiatives[0]!.agentThread.messages.length + 1,
    );
    expect(updatedWorkspace.tasks[1]?.agentThread.messages).toHaveLength(
      workspaceSeed.tasks[1]!.agentThread.messages.length,
    );
  });

  /**
   * Removes one thread message from the requested task.
   */
  it("deletes one message from a task thread", () => {
    const updatedWorkspace = deleteThreadMessage(
      workspaceSeed,
      {
        ownerType: "task",
        ownerId: "task-2",
      },
      "message-1",
    );

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-2")?.agentThread.messages).toEqual([
      {
        id: "message-2",
        role: "agent",
        content: [
          "## Starter direction",
          "",
          "- Use one clean list",
          "- Keep metadata light",
          "- Keep agent actions inside each task",
        ].join("\n"),
        createdAt: "Earlier today",
        providerId: "openai",
        model: "gpt-5",
        status: "done",
      },
    ]);
  });
});
