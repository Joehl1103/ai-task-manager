import { type Task } from "./types";

export const noProjectGroupLabel = "No project";

export interface TaskGroup {
  key: string;
  title: string;
  taskCount: number;
  tasks: Task[];
}

/**
 * Builds lightweight project sections for the overview while keeping the source task list flat.
 */
export function buildTaskGroups(tasks: Task[]): TaskGroup[] {
  const groupsByKey = new Map<string, TaskGroup>();

  tasks.forEach((task) => {
    const title = readProjectGroupTitle(task.project);
    const key = title.toLocaleLowerCase();
    const existingGroup = groupsByKey.get(key);

    if (existingGroup) {
      existingGroup.tasks.push(task);
      existingGroup.taskCount += 1;
      return;
    }

    groupsByKey.set(key, {
      key,
      title,
      taskCount: 1,
      tasks: [task],
    });
  });

  return Array.from(groupsByKey.values());
}

/**
 * Normalizes empty project values into a visible fallback section label.
 */
function readProjectGroupTitle(project: string) {
  const normalizedProject = project.trim();

  return normalizedProject || noProjectGroupLabel;
}
