import { type Task } from "./types";

export const noProjectLabel = "No project";

export interface TaskGroup {
  project: string;
  label: string;
  tasks: Task[];
}

/**
 * Groups tasks by project while preserving task order within each group.
 * Tasks without a project are collected into a fallback group labeled "No project".
 */
export function groupTasksByProject(tasks: Task[]): TaskGroup[] {
  const groupMap = new Map<string, Task[]>();

  for (const task of tasks) {
    const projectKey = task.project.trim() || "";
    const existingTasks = groupMap.get(projectKey) ?? [];
    groupMap.set(projectKey, [...existingTasks, task]);
  }

  const groups: TaskGroup[] = [];
  const noProjectTasks = groupMap.get("");

  for (const [project, projectTasks] of groupMap) {
    if (project === "") {
      continue;
    }

    groups.push({
      project,
      label: project,
      tasks: projectTasks,
    });
  }

  if (noProjectTasks && noProjectTasks.length > 0) {
    groups.push({
      project: "",
      label: noProjectLabel,
      tasks: noProjectTasks,
    });
  }

  return groups;
}

/**
 * Returns the total task count across all groups for display purposes.
 */
export function countGroupedTasks(groups: TaskGroup[]): number {
  return groups.reduce((total, group) => total + group.tasks.length, 0);
}
