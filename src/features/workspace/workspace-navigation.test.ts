import { describe, expect, it } from "vitest";

import {
  createDefaultWorkspaceMenu,
  readWorkspaceMenuHint,
  readWorkspaceMenuLabel,
  workspaceMenus,
} from "@/features/workspace/navigation";

describe("workspace navigation", () => {
  /**
   * Keeps the app focused on inbox work until the user deliberately opens other views.
   */
  it("defaults to the inbox menu", () => {
    expect(createDefaultWorkspaceMenu()).toBe("inbox");
  });

  /**
   * Ensures the slim top menu still shows clear labels for all destinations.
   */
  it("reads labels and hints for each top-level menu", () => {
    expect(readWorkspaceMenuLabel("inbox")).toBe("Inbox");
    expect(readWorkspaceMenuHint("inbox")).toBe("Inbox workspace");
    expect(readWorkspaceMenuLabel("tasks")).toBe("Tasks");
    expect(readWorkspaceMenuHint("tasks")).toBe("All active tasks");
    expect(readWorkspaceMenuLabel("documentation")).toBe("Documentation");
    expect(readWorkspaceMenuHint("documentation")).toBe("API wiki");
    expect(readWorkspaceMenuLabel("configuration")).toBe("Configuration");
    expect(readWorkspaceMenuHint("configuration")).toBe("Provider setup");
    expect(workspaceMenus).toContain("tasks");
    expect(workspaceMenus).toContain("documentation");
  });
});
