import { describe, expect, it } from "vitest";

import { workspaceSeed } from "./mock-data";
import {
  buildProjectTaskSelection,
  filterTasksByProject,
  readProjectFilterName,
} from "./project-selection";

describe("project selection", () => {
  /**
   * Routes project clicks into the projects view and opens the first matching task.
   */
  it("builds a task-focused selection for a project with tasks", () => {
    const selection = buildProjectTaskSelection(workspaceSeed.tasks, "project-1");

    expect(selection).toEqual({
      activeMenu: "projects",
      filterProjectId: "project-1",
      selectedTaskId: "task-1",
    });
  });

  /**
   * Keeps the projects view scoped to the project even when no task drill-down exists yet.
   */
  it("leaves the task drill-down empty when the project has no tasks", () => {
    const selection = buildProjectTaskSelection(workspaceSeed.tasks, "project-2");

    expect(selection).toEqual({
      activeMenu: "projects",
      filterProjectId: "project-2",
      selectedTaskId: null,
    });
  });

  /**
   * Limits the visible task list to one project while preserving existing task order.
   */
  it("filters tasks down to the selected project", () => {
    const visibleTasks = filterTasksByProject(workspaceSeed.tasks, "project-1");

    expect(visibleTasks.map((task) => task.id)).toEqual(["task-1", "task-2"]);
  });

  /**
   * Resolves the visible project name so the task header can explain the active filter.
   */
  it("reads the active project filter label from the project list", () => {
    expect(readProjectFilterName(workspaceSeed.projects, "project-1")).toBe("Relay MVP");
  });
});
