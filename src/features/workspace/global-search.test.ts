import { describe, expect, it } from "vitest";

import { workspaceSeed } from "./mock-data";
import {
  buildGlobalSearchResults,
  cycleGlobalSearchIndex,
  filterGlobalSearchResults,
  readGlobalSearchEntityLabel,
  resolveGlobalSearchSelection,
} from "./global-search";

/**
 * Keeps the command search tests grounded in the same starter workspace data the app renders.
 */
function buildSeedResults() {
  return buildGlobalSearchResults(workspaceSeed);
}

describe("global search", () => {
  /**
   * Ensures the dialog can search across all supported workspace entity types.
   */
  it("builds searchable results for tasks, projects, and initiatives", () => {
    const results = buildSeedResults();

    expect(results).toHaveLength(7);
    expect(results.map((result) => readGlobalSearchEntityLabel(result.entityType))).toEqual([
      "Task",
      "Task",
      "Task",
      "Project",
      "Project",
      "Project",
      "Initiative",
    ]);
  });

  /**
   * Verifies that task metadata like details, tags, project names, and initiative names all
   * contribute to the normalized search string for the MVP matcher.
   */
  it("matches task results by details, tags, project names, and initiative names", () => {
    const results = buildSeedResults();

    expect(filterGlobalSearchResults(results, "editable").map((result) => result.id)).toEqual([
      "task-2",
    ]);
    expect(filterGlobalSearchResults(results, "high-priority").map((result) => result.id)).toEqual([
      "task-2",
    ]);
    expect(filterGlobalSearchResults(results, "relay mvp").map((result) => result.id)).toEqual([
      "task-1",
      "task-2",
      "project-1",
    ]);
    expect(filterGlobalSearchResults(results, "product launch").map((result) => result.id)).toEqual([
      "task-1",
      "task-2",
      "project-1",
      "initiative-1",
    ]);
  });

  /**
   * Confirms initiative descriptions remain searchable even when the initiative name does not
   * contain the query string.
   */
  it("matches initiative results by description text", () => {
    const results = buildSeedResults();

    expect(filterGlobalSearchResults(results, "marketing").map((result) => result.id)).toEqual([
      "initiative-1",
    ]);
  });

  /**
   * Keeps the task context label understandable when a task belongs to both a project and
   * an initiative.
   */
  it("attaches parent context labels to task results", () => {
    const result = buildSeedResults().find((candidate) => candidate.id === "task-1");

    expect(result?.contextLabel).toBe(
      "Project: Relay MVP · Initiative: Q2 Product Launch",
    );
  });

  /**
   * Ensures task selections navigate to the inbox view with the selected task open.
   */
  it("maps task selections back into the inbox view", () => {
    const results = buildSeedResults();
    const taskResult = results.find((candidate) => candidate.id === "task-1");

    expect(taskResult).toBeDefined();
    expect(resolveGlobalSearchSelection(taskResult!, workspaceSeed)).toEqual({
      activeMenu: "inbox",
      filterProjectId: null,
      filterInitiativeId: null,
      selectedTaskId: "task-1",
    });
  });

  /**
   * Routes project selections to the projects view with the first matching task selected.
   */
  it("maps project selections into the projects view", () => {
    const results = buildSeedResults();
    const projectResult = results.find((candidate) => candidate.id === "project-1");

    expect(projectResult).toBeDefined();
    expect(resolveGlobalSearchSelection(projectResult!, workspaceSeed)).toEqual({
      activeMenu: "projects",
      filterProjectId: "project-1",
      filterInitiativeId: null,
      selectedTaskId: "task-1",
    });
  });

  /**
   * Leaves the task drill-down closed when a searched project has no linked tasks yet.
   */
  it("keeps project selections on the projects view when the project has no tasks", () => {
    const results = buildSeedResults();
    const projectResult = results.find((candidate) => candidate.id === "project-2");

    expect(projectResult).toBeDefined();
    expect(resolveGlobalSearchSelection(projectResult!, workspaceSeed)).toEqual({
      activeMenu: "projects",
      filterProjectId: "project-2",
      filterInitiativeId: null,
      selectedTaskId: null,
    });
  });

  /**
   * Routes initiative selections to the initiatives view.
   */
  it("maps initiative selections into the initiatives view", () => {
    const results = buildSeedResults();
    const initiativeResult = results.find((candidate) => candidate.id === "initiative-1");

    expect(initiativeResult).toBeDefined();
    expect(resolveGlobalSearchSelection(initiativeResult!, workspaceSeed)).toEqual({
      activeMenu: "initiatives",
      filterProjectId: null,
      filterInitiativeId: "initiative-1",
      selectedTaskId: null,
    });
  });
});

describe("global search keyboard helpers", () => {
  /**
   * Wraps keyboard navigation to the top when the user advances past the final result.
   */
  it("cycles forward through the result list", () => {
    expect(cycleGlobalSearchIndex(0, "next", 3)).toBe(1);
    expect(cycleGlobalSearchIndex(2, "next", 3)).toBe(0);
  });

  /**
   * Wraps keyboard navigation to the bottom when the user moves above the first result.
   */
  it("cycles backward through the result list", () => {
    expect(cycleGlobalSearchIndex(1, "previous", 3)).toBe(0);
    expect(cycleGlobalSearchIndex(0, "previous", 3)).toBe(2);
  });

  /**
   * Keeps empty result sets from producing invalid active selections.
   */
  it("returns a sentinel index when there are no results", () => {
    expect(cycleGlobalSearchIndex(0, "next", 0)).toBe(-1);
  });
});
