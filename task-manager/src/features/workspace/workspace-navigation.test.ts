import { describe, expect, it } from "vitest";

import {
  createDefaultWorkspaceView,
  readWorkspaceViewHint,
  readWorkspaceViewLabel,
} from "./workspace-navigation";

describe("workspace navigation", () => {
  /**
   * Keeps the app focused on task work until the user deliberately opens configuration.
   */
  it("defaults to the tasks view", () => {
    expect(createDefaultWorkspaceView()).toBe("tasks");
  });

  /**
   * Ensures the slim top menu still shows clear labels for both destinations.
   */
  it("reads labels and hints for each top-level view", () => {
    expect(readWorkspaceViewLabel("tasks")).toBe("Tasks");
    expect(readWorkspaceViewHint("tasks")).toBe("Task workspace");
    expect(readWorkspaceViewLabel("configuration")).toBe("Configuration");
    expect(readWorkspaceViewHint("configuration")).toBe("Provider setup");
  });
});
