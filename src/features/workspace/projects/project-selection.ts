import { type Project, type Task } from "@/features/workspace/core";
import { type WorkspaceMenu } from "@/features/workspace/navigation";

export interface ProjectTaskSelection {
  activeMenu: WorkspaceMenu;
  filterProjectId: string;
  selectedTaskId: string | null;
}

/**
 * Builds the next workspace state when a project is selected from the project list.
 * The task selection stays available so project detail can open inline editing when appropriate.
 */
export function buildProjectTaskSelection(
  tasks: Task[],
  projectId: string,
): ProjectTaskSelection {
  const nextSelectedTask = tasks.find((task) => task.projectId === projectId) ?? null;

  return {
    activeMenu: "projects",
    filterProjectId: projectId,
    selectedTaskId: nextSelectedTask?.id ?? null,
  };
}

/**
 * Restricts the visible task list to one project when a filter is active.
 */
export function filterTasksByProject(tasks: Task[], filterProjectId: string | null): Task[] {
  if (!filterProjectId) {
    return tasks;
  }

  return tasks.filter((task) => task.projectId === filterProjectId);
}

/**
 * Resolves the current project filter label for display in the task header.
 */
export function readProjectFilterName(
  projects: Project[],
  filterProjectId: string | null,
): string | null {
  if (!filterProjectId) {
    return null;
  }

  return projects.find((project) => project.id === filterProjectId)?.name ?? filterProjectId;
}
