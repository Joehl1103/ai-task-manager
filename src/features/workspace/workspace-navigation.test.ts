import { describe, expect, it } from "vitest";

import {
  createDefaultWorkspaceMenu,
  readWorkspaceMenuHint,
  readWorkspaceMenuLabel,
} from "./workspace-navigation";

describe("workspace navigation", () => {
  /**
   * Keeps the app focused on task work until the user deliberately opens configuration.
   */
  it("defaults to the tasks menu", () => {
    expect(createDefaultWorkspaceMenu()).toBe("tasks");
  });

  /**
   * Ensures the slim top menu still shows clear labels for both destinations.
   */
  it("reads labels and hints for each top-level menu", () => {
    expect(readWorkspaceMenuLabel("tasks")).toBe("Tasks");
    expect(readWorkspaceMenuHint("tasks")).toBe("Task workspace");
    expect(readWorkspaceMenuLabel("configuration")).toBe("Configuration");
    expect(readWorkspaceMenuHint("configuration")).toBe("Provider setup");
  });
});
