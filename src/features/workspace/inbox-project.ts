import { createAgentThread } from "./thread-helpers";
import { type Project, type Task } from "./types";

export const inboxProjectId = "project-inbox";
export const inboxProjectName = "Inbox";
export const inboxPickerLabel = "Keep in Inbox";
export const noProjectProjectId = "project-no-project";
export const noProjectProjectName = "No Project";

/**
 * Builds the hidden system project that backs the dedicated inbox view.
 */
export function createInboxProject(): Project {
  return {
    id: inboxProjectId,
    name: inboxProjectName,
    initiativeId: "",
    deadline: "",
    agentThread: createAgentThread("project", inboxProjectId),
  };
}

/**
 * Builds the permanent visible fallback project for tasks that should live outside inbox.
 */
export function createNoProjectProject(): Project {
  return {
    id: noProjectProjectId,
    name: noProjectProjectName,
    initiativeId: "",
    deadline: "",
    agentThread: createAgentThread("project", noProjectProjectId),
  };
}

/**
 * Treats only the hidden inbox id as a hidden system project.
 */
export function isHiddenInboxProjectId(projectId: string | null | undefined) {
  const normalizedProjectId = projectId?.trim() ?? "";

  return normalizedProjectId === inboxProjectId;
}

/**
 * Prevents deletion of built-in system projects.
 */
export function isPermanentProjectId(projectId: string | null | undefined) {
  const normalizedProjectId = projectId?.trim() ?? "";

  return normalizedProjectId === inboxProjectId || normalizedProjectId === noProjectProjectId;
}

/**
 * Normalizes blank task assignments into the hidden inbox project id.
 */
export function normalizeTaskProjectId(projectId: string | null | undefined): string {
  const normalizedProjectId = projectId?.trim() ?? "";

  if (!normalizedProjectId) {
    return inboxProjectId;
  }

  return normalizedProjectId;
}

/**
 * Maps stored inbox assignments back to the blank picker value used for "no visible project".
 */
export function readProjectPickerValue(projectId: string | null | undefined): string {
  return normalizeTaskProjectId(projectId) === inboxProjectId
    ? ""
    : projectId?.trim() ?? "";
}

/**
 * Keeps the inbox view resilient while older local storage may still contain blank assignments.
 */
export function isTaskInInbox(task: Pick<Task, "projectId">): boolean {
  return normalizeTaskProjectId(task.projectId) === inboxProjectId;
}

/**
 * Removes the hidden inbox project from project lists and pickers.
 */
export function filterVisibleProjects<ProjectLike extends Pick<Project, "id">>(
  projects: ProjectLike[],
): ProjectLike[] {
  return projects.filter((project) => !isHiddenInboxProjectId(project.id));
}
