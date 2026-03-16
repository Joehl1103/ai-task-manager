import { describe, expect, it } from "vitest";

import { workspaceSeed } from "./mock-data";
import {
  buildTaskDetailsPreview,
  buildTaskOverviewSummary,
  readSelectedTask,
} from "./task-overview";

describe("task overview helpers", () => {
  /**
   * Keeps overview cards short so the main list stays compact.
   */
  it("truncates long task details for the overview list", () => {
    expect(
      buildTaskDetailsPreview(
        "This is a deliberately long task description that should be shortened before it reaches the compact overview card.",
        40,
      ),
    ).toBe("This is a deliberately long task...");
  });

  /**
   * Falls back cleanly when a task does not yet have any details.
   */
  it("uses a clear placeholder for empty details", () => {
    expect(buildTaskDetailsPreview("   ")).toBe("No details yet.");
  });

  /**
   * Summarizes agent activity so the overview list can show only lightweight metadata.
   */
  it("builds the agent summary from the latest task activity", () => {
    expect(buildTaskOverviewSummary(workspaceSeed.tasks[1]!)).toEqual({
      detailsPreview: "Use this as an example of a normal editable task.",
      agentCallCount: 1,
      latestAgentStatus: "done",
      latestAgentTimestamp: "Earlier today",
    });
  });

  /**
   * Returns the selected task when drill-down mode opens a specific task.
   */
  it("reads the selected task from the workspace snapshot", () => {
    expect(readSelectedTask(workspaceSeed.tasks, "task-1")?.title).toBe(
      "Define the smallest possible task manager",
    );
    expect(readSelectedTask(workspaceSeed.tasks, "missing-task")).toBeNull();
  });
});
