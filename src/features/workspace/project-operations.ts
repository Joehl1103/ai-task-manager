import {
  isPermanentProjectId,
  noProjectProjectId,
} from "./inbox-project";
import {
  type AddProjectInput,
  type Project,
  type UpdateProjectInput,
  type WorkspaceSnapshot,
} from "./types";
import { createAgentThread } from "./thread-helpers";

/**
 * Adds a new project to the workspace.
 */
export function addProject(
  workspace: WorkspaceSnapshot,
  input: AddProjectInput,
): WorkspaceSnapshot {
  const nextProjectId = buildNextProjectId(workspace.projects);
  const nextProject: Project = {
    id: nextProjectId,
    name: input.name.trim(),
    initiativeId: input.initiativeId.trim(),
    deadline: input.deadline.trim(),
    agentThread: createAgentThread("project", nextProjectId),
  };

  return {
    ...workspace,
    projects: [nextProject, ...workspace.projects],
  };
}

/**
 * Updates an existing project.
 */
export function updateProject(
  workspace: WorkspaceSnapshot,
  input: UpdateProjectInput,
): WorkspaceSnapshot {
  return {
    ...workspace,
    projects: workspace.projects.map((project) =>
      project.id === input.projectId
        ? {
            ...project,
            name: input.name.trim(),
            initiativeId: input.initiativeId.trim(),
            deadline: input.deadline.trim(),
          }
        : project,
    ),
  };
}

/**
 * Deletes a project. Tasks referencing it will have their projectId cleared.
 */
export function deleteProject(
  workspace: WorkspaceSnapshot,
  projectId: string,
): WorkspaceSnapshot {
  if (isPermanentProjectId(projectId)) {
    return workspace;
  }

  return {
    ...workspace,
    projects: workspace.projects.filter((p) => p.id !== projectId),
    tasks: workspace.tasks.map((task) =>
      task.projectId === projectId
        ? { ...task, projectId: noProjectProjectId }
        : task,
    ),
  };
}

/**
 * Counts tasks belonging to a project.
 */
export function countTasksInProject(
  workspace: WorkspaceSnapshot,
  projectId: string,
): number {
  return workspace.tasks.filter((t) => t.projectId === projectId).length;
}

/**
 * Finds a project by ID.
 */
export function findProject(
  workspace: WorkspaceSnapshot,
  projectId: string,
): Project | undefined {
  return workspace.projects.find((p) => p.id === projectId);
}

/**
 * Gets projects filtered by initiative.
 */
export function getProjectsByInitiative(
  workspace: WorkspaceSnapshot,
  initiativeId: string,
): Project[] {
  return workspace.projects.filter((p) => p.initiativeId === initiativeId);
}

/**
 * Builds a stable incremental project id.
 */
function buildNextProjectId(projects: Project[]) {
  const nextNumber = projects.reduce((highest, project) => {
    const current = Number(project.id.replace("project-", ""));
    return Number.isNaN(current) ? highest : Math.max(highest, current);
  }, 0);

  return `project-${nextNumber + 1}`;
}
