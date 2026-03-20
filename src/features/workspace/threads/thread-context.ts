import { type ThreadOwnerRef, type WorkspaceSnapshot } from "@/features/workspace/core";
import { inboxProjectName, isTaskInInbox } from "@/features/workspace/projects";

const defaultChildSummaryLimit = 8;

/**
 * Reads the display name for the owner whose thread is currently active.
 */
export function readThreadOwnerName(
  workspace: WorkspaceSnapshot,
  owner: ThreadOwnerRef,
) {
  if (owner.ownerType === "task") {
    return workspace.tasks.find((task) => task.id === owner.ownerId)?.title || "Untitled task";
  }

  if (owner.ownerType === "project") {
    return workspace.projects.find((project) => project.id === owner.ownerId)?.name || "Untitled project";
  }

  return (
    workspace.initiatives.find((initiative) => initiative.id === owner.ownerId)?.name ||
    "Untitled initiative"
  );
}

/**
 * Builds the compact entity context that is sent alongside one thread transcript.
 */
export function buildThreadContextSummary(
  workspace: WorkspaceSnapshot,
  owner: ThreadOwnerRef,
) {
  if (owner.ownerType === "task") {
    return buildTaskContextSummary(workspace, owner.ownerId);
  }

  if (owner.ownerType === "project") {
    return buildProjectContextSummary(workspace, owner.ownerId);
  }

  return buildInitiativeContextSummary(workspace, owner.ownerId);
}

/**
 * Reads a short placeholder tailored to the current owner type.
 */
export function readThreadComposerPlaceholder(owner: ThreadOwnerRef) {
  if (owner.ownerType === "task") {
    return "What should the agent help with on this task?";
  }

  if (owner.ownerType === "project") {
    return "What should the agent help with on this project?";
  }

  return "What should the agent help with on this initiative?";
}

/**
 * Builds the task context using the task plus its parent project and initiative names.
 */
function buildTaskContextSummary(workspace: WorkspaceSnapshot, taskId: string) {
  const task = workspace.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    return "Task not found.";
  }

  const project = task.projectId
    ? workspace.projects.find((candidate) => candidate.id === task.projectId)
    : null;
  const initiative = project?.initiativeId
    ? workspace.initiatives.find((candidate) => candidate.id === project.initiativeId)
    : null;
  const projectLabel = isTaskInInbox(task) ? inboxProjectName : project?.name || inboxProjectName;

  return [
    `Task title: ${task.title}`,
    `Task details: ${task.details || "No task details provided."}`,
    `Task deadline: ${task.deadline || "No deadline"}`,
    `Task tags: ${task.tags.length > 0 ? task.tags.join(", ") : "No tags"}`,
    `Project: ${projectLabel}`,
    `Initiative: ${initiative?.name || "No initiative"}`,
  ].join("\n");
}

/**
 * Builds the project context from the project plus lightweight child-task summaries.
 */
function buildProjectContextSummary(workspace: WorkspaceSnapshot, projectId: string) {
  const project = workspace.projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    return "Project not found.";
  }

  const initiative = project.initiativeId
    ? workspace.initiatives.find((candidate) => candidate.id === project.initiativeId)
    : null;
  const childTasks = workspace.tasks
    .filter((task) => task.projectId === projectId)
    .slice(0, defaultChildSummaryLimit);

  return [
    `Project name: ${project.name}`,
    `Project deadline: ${project.deadline || "No deadline"}`,
    `Initiative: ${initiative?.name || "No initiative"}`,
    "Child tasks:",
    childTasks.length > 0
      ? childTasks
          .map((task) => `- ${task.title}: ${buildInlineSummary(task.details)}`)
          .join("\n")
      : "- No tasks yet.",
  ].join("\n");
}

/**
 * Builds the initiative context from the initiative plus lightweight child-project summaries.
 */
function buildInitiativeContextSummary(workspace: WorkspaceSnapshot, initiativeId: string) {
  const initiative = workspace.initiatives.find((candidate) => candidate.id === initiativeId);

  if (!initiative) {
    return "Initiative not found.";
  }

  const childProjects = workspace.projects
    .filter((project) => project.initiativeId === initiativeId)
    .slice(0, defaultChildSummaryLimit);

  return [
    `Initiative name: ${initiative.name}`,
    `Initiative description: ${initiative.description || "No description provided."}`,
    `Initiative deadline: ${initiative.deadline || "No deadline"}`,
    "Child projects:",
    childProjects.length > 0
      ? childProjects
          .map((project) => `- ${project.name}${project.deadline ? ` (due ${project.deadline})` : ""}`)
          .join("\n")
      : "- No projects yet.",
  ].join("\n");
}

/**
 * Keeps child-item summaries short so prompt context does not explode immediately.
 */
function buildInlineSummary(value: string, maxLength = 120) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "No details.";
  }

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength).trimEnd()}...`;
}
