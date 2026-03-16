import { describe, expect, it } from "vitest";

import { workspaceSeed } from "./mock-data";
import {
  addTask,
  deleteAgentCall,
  deleteTask,
  recordAgentCall,
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
      project: "",
      agentCalls: [],
    });
  });

  /**
   * Creates a task with a project assignment.
   */
  it("adds a task with a project", () => {
    const updatedWorkspace = addTask(workspaceSeed, {
      title: "Review sprint goals",
      details: "Check alignment with Q1 objectives.",
      project: "Planning",
    });

    expect(updatedWorkspace.tasks[0]).toMatchObject({
      title: "Review sprint goals",
      details: "Check alignment with Q1 objectives.",
      project: "Planning",
    });
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
      project: "New Project",
    });

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")).toMatchObject({
      project: "New Project",
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
      project: "Relay MVP",
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
   * Removes one saved agent contribution without disturbing the rest of the task data.
   */
  it("deletes one agent call from a task", () => {
    const updatedWorkspace = deleteAgentCall(workspaceSeed, "task-2", "call-1");

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-2")).toMatchObject({
      id: "task-2",
      title: "List the next three product decisions",
      details: "Use this as an example of a normal editable task.",
      agentCalls: [],
    });
  });

  /**
   * Keeps deletion scoped so one task's agent history never edits another task.
   */
  it("only deletes the requested agent call from the requested task", () => {
    const workspaceWithExtraCall = recordAgentCall(workspaceSeed, {
      taskId: "task-1",
      providerId: "openai",
      model: "gpt-5",
      brief: "Suggest a sharper problem statement.",
      now: "Later",
      status: "done",
      result: "Focus on compact task review plus drill-down detail.",
    });
    const updatedWorkspace = deleteAgentCall(workspaceWithExtraCall, "task-2", "call-1");

    expect(updatedWorkspace.tasks.find((task) => task.id === "task-2")?.agentCalls).toEqual([]);
    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")?.agentCalls).toHaveLength(
      1,
    );
  });

  /**
   * Models a successful provider-backed call by attaching the response to the task.
   */
  it("calls an agent from within a task", () => {
    const updatedWorkspace = recordAgentCall(workspaceSeed, {
      taskId: "task-1",
      providerId: "openai",
      model: "gpt-5",
      brief: "Return with three examples of simple task manager layouts.",
      now: "Now",
      status: "done",
      result: "Use one list, plain editing, and task-level agent actions.",
    });

    const updatedTask = updatedWorkspace.tasks.find((task) => task.id === "task-1");

    expect(updatedTask?.agentCalls[0]).toMatchObject({
      providerId: "openai",
      model: "gpt-5",
      brief: "Return with three examples of simple task manager layouts.",
      status: "done",
      createdAt: "Now",
      result: "Use one list, plain editing, and task-level agent actions.",
    });
  });
});
