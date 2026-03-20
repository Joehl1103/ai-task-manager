import { describe, expect, it } from "vitest";

import {
  deleteProject,
  inboxProjectId,
  noProjectProjectId,
} from "@/features/workspace/projects";

import { workspaceSeed } from "./mock-data";

describe("project operations", () => {
  /**
   * Keeps the visible No Project bucket permanent so users always have a non-inbox fallback.
   */
  it("does not delete the default no-project project", () => {
    const updatedWorkspace = deleteProject(workspaceSeed, noProjectProjectId);

    expect(updatedWorkspace.projects.some((project) => project.id === noProjectProjectId)).toBe(true);
  });

  /**
   * Keeps the hidden inbox system project permanent as well.
   */
  it("does not delete the hidden inbox project", () => {
    const updatedWorkspace = deleteProject(workspaceSeed, inboxProjectId);

    expect(updatedWorkspace.projects.some((project) => project.id === inboxProjectId)).toBe(true);
  });

  /**
   * Moves tasks into No Project when their current visible project is deleted.
   */
  it("moves deleted-project tasks into the no-project project", () => {
    const updatedWorkspace = deleteProject(workspaceSeed, "project-1");

    expect(updatedWorkspace.projects.some((project) => project.id === "project-1")).toBe(false);
    expect(updatedWorkspace.tasks.find((task) => task.id === "task-1")?.projectId).toBe(
      noProjectProjectId,
    );
    expect(updatedWorkspace.tasks.find((task) => task.id === "task-2")?.projectId).toBe(
      noProjectProjectId,
    );
  });
});
