export type WorkspaceMenu = "tasks" | "projects" | "initiatives" | "configuration";

export const workspaceMenus: WorkspaceMenu[] = ["tasks", "projects", "initiatives", "configuration"];

/**
 * Keeps task work as the default landing menu for the app shell.
 */
export function createDefaultWorkspaceMenu(): WorkspaceMenu {
  return "tasks";
}

/**
 * Converts the internal menu id into the short label shown in the top menu.
 */
export function readWorkspaceMenuLabel(menu: WorkspaceMenu): string {
  switch (menu) {
    case "tasks":
      return "Tasks";
    case "projects":
      return "Projects";
    case "initiatives":
      return "Initiatives";
    case "configuration":
      return "Configuration";
  }
}

/**
 * Provides a compact hint so the slim top menu still communicates each destination.
 */
export function readWorkspaceMenuHint(menu: WorkspaceMenu): string {
  switch (menu) {
    case "tasks":
      return "Task workspace";
    case "projects":
      return "Project management";
    case "initiatives":
      return "Initiative planning";
    case "configuration":
      return "Provider setup";
  }
}
