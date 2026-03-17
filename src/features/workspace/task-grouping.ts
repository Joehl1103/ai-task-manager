import { type Project, type Task } from "./types";

export const noProjectLabel = "No project";
export const noTagsLabel = "No tags";

export interface TaskGroup {
  project: string;
  label: string;
  tasks: Task[];
}

/**
 * Creates a lookup map from project ID to project name.
 */
export function createProjectNameMap(projects: Project[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const project of projects) {
    map.set(project.id, project.name);
  }
  return map;
}

/**
 * Groups tasks by project while preserving task order within each group.
 * Tasks without a project are collected into a fallback group labeled "No project".
 */
export function groupTasksByProject(tasks: Task[], projects: Project[]): TaskGroup[] {
  const projectNameMap = createProjectNameMap(projects);
  const groupMap = new Map<string, Task[]>();

  for (const task of tasks) {
    const projectKey = task.projectId.trim() || "";
    const existingTasks = groupMap.get(projectKey) ?? [];
    groupMap.set(projectKey, [...existingTasks, task]);
  }

  const groups: TaskGroup[] = [];
  const noProjectTasks = groupMap.get("");

  for (const [projectId, projectTasks] of groupMap) {
    if (projectId === "") {
      continue;
    }

    const projectName = projectNameMap.get(projectId) || projectId;
    groups.push({
      project: projectId,
      label: projectName,
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
 * Groups tasks by tag, with each task appearing in each of its tag groups.
 * Tasks without tags are collected into a fallback group labeled "No tags".
 * Tags are sorted alphabetically, with the "No tags" group appearing last.
 */
export function groupTasksByTag(tasks: Task[]): TaskGroup[] {
  const tagMap = new Map<string, Task[]>();
  const untaggedTasks: Task[] = [];

  for (const task of tasks) {
    if (task.tags.length === 0) {
      untaggedTasks.push(task);
    } else {
      for (const tag of task.tags) {
        const trimmedTag = tag.trim();
        const existingTasks = tagMap.get(trimmedTag) ?? [];
        tagMap.set(trimmedTag, [...existingTasks, task]);
      }
    }
  }

  const groups: TaskGroup[] = [];
  const sortedTags = Array.from(tagMap.keys()).sort();

  for (const tag of sortedTags) {
    const tagTasks = tagMap.get(tag);

    if (tagTasks) {
      groups.push({
        project: tag,
        label: tag,
        tasks: tagTasks,
      });
    }
  }

  if (untaggedTasks.length > 0) {
    groups.push({
      project: "",
      label: noTagsLabel,
      tasks: untaggedTasks,
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
