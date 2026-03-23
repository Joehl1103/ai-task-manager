import { featureFlags } from "@/features/feature-flags";

export type WorkspaceMenu = "inbox" | "tasks" | "projects" | "initiatives" | "archive" | "configuration";

const allMenus: WorkspaceMenu[] = ["inbox", "tasks", "projects", "initiatives", "archive", "configuration"];

/** Menus visible to the user, filtered by active feature flags. */
export const workspaceMenus: WorkspaceMenu[] = allMenus.filter(
  (menu) => menu !== "initiatives" || featureFlags.initiatives,
);

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
    case "tasks":
      return "Tasks";
    case "projects":
      return "Projects";
    case "initiatives":
      return "Initiatives";
    case "archive":
      return "Archive";
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
    case "tasks":
      return "All active tasks";
    case "projects":
      return "Project management";
    case "initiatives":
      return "Initiative planning";
    case "archive":
      return "Completed tasks";
    case "configuration":
      return "Provider setup";
  }
}
