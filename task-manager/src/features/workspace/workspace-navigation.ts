export type WorkspaceMenu = "tasks" | "configuration";

export const workspaceMenus: WorkspaceMenu[] = ["tasks", "configuration"];

/**
 * Keeps task work as the default landing menu for the app shell.
 */
export function createDefaultWorkspaceMenu(): WorkspaceMenu {
  return "tasks";
}

/**
 * Converts the internal menu id into the short label shown in the top menu.
 */
export function readWorkspaceMenuLabel(menu: WorkspaceMenu) {
  return menu === "tasks" ? "Tasks" : "Configuration";
}

/**
 * Provides a compact hint so the slim top menu still communicates each destination.
 */
export function readWorkspaceMenuHint(menu: WorkspaceMenu) {
  return menu === "tasks" ? "Task workspace" : "Provider setup";
}
