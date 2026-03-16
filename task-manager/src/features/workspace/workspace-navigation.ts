export type WorkspaceView = "tasks" | "configuration";

export const workspaceViews: WorkspaceView[] = ["tasks", "configuration"];

/**
 * Keeps task work as the default landing view for the app shell.
 */
export function createDefaultWorkspaceView(): WorkspaceView {
  return "tasks";
}

/**
 * Converts the internal view id into the short label shown in the top menu.
 */
export function readWorkspaceViewLabel(view: WorkspaceView) {
  return view === "tasks" ? "Tasks" : "Configuration";
}

/**
 * Provides a compact hint so the slim top menu still communicates each destination.
 */
export function readWorkspaceViewHint(view: WorkspaceView) {
  return view === "tasks" ? "Task workspace" : "Provider setup";
}
