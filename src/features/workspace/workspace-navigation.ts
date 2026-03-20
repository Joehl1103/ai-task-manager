export type WorkspaceMenu = "inbox" | "projects" | "initiatives" | "configuration";

export const workspaceMenus: WorkspaceMenu[] = ["inbox", "projects", "initiatives", "configuration"];

/**
 * Keeps inbox as the default landing menu for the app shell.
 */
export function createDefaultWorkspaceMenu(): WorkspaceMenu {
  return "inbox";
}

/**
 * Converts the internal menu id into the short label shown in the top menu.
 */
export function readWorkspaceMenuLabel(menu: WorkspaceMenu): string {
  switch (menu) {
    case "inbox":
      return "Inbox";
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
    case "inbox":
      return "Inbox workspace";
    case "projects":
      return "Project management";
    case "initiatives":
      return "Initiative planning";
    case "configuration":
      return "Provider setup";
  }
}
