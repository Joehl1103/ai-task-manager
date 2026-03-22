import {
  createInboxProject,
  createNoProjectProject,
  inboxProjectId,
  inboxProjectName,
  noProjectProjectId,
  noProjectProjectName,
  normalizeTaskProjectId,
} from "@/features/workspace/projects";
import { workspaceSeed } from "@/features/workspace/mock-data";
import { isProviderId } from "@/features/workspace/providers";
import { createAgentThread } from "@/features/workspace/threads";
import {
  type AgentThread,
  type AgentThreadMessage,
  type Initiative,
  type Project,
  type Task,
  type ThreadMessageRole,
  type ThreadMessageStatus,
  type ThreadOwnerType,
  type WorkspaceSnapshot,
} from "@/features/workspace/core";

export const workspaceStorageKey = "relay-workspace";
export const taskGroupingModeStorageKey = "relay-task-grouping-mode";

export type TaskGroupingMode = "project" | "tag";

export const defaultTaskGroupingMode: TaskGroupingMode = "project";

/**
 * Creates a fresh copy of the seed workspace so local state never mutates shared module data.
 */
export function createDefaultWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    initiatives: workspaceSeed.initiatives.map((initiative) => ({
      ...initiative,
      agentThread: cloneThread(initiative.agentThread),
    })),
    projects: workspaceSeed.projects.map((project) => ({
      ...project,
      agentThread: cloneThread(project.agentThread),
    })),
    tasks: workspaceSeed.tasks.map((task) => ({
      ...task,
      agentThread: cloneThread(task.agentThread),
    })),
  };
}

/**
 * Normalizes saved workspace data so malformed local storage entries do not break the UI.
 * Handles migration from the old format where tasks stored `project` and `agentCalls`.
 */
export function normalizeWorkspaceSnapshot(value: unknown): WorkspaceSnapshot {
  const defaults = createDefaultWorkspaceSnapshot();

  if (!isRecord(value)) {
    return defaults;
  }

  const needsMigration =
    Array.isArray(value.tasks) &&
    value.tasks.length > 0 &&
    !Array.isArray(value.projects) &&
    isRecord(value.tasks[0]) &&
    typeof value.tasks[0].project === "string" &&
    value.tasks[0].projectId === undefined;

  if (needsMigration) {
    return migrateFromLegacyFormat(value.tasks as unknown[]);
  }

  if (!Array.isArray(value.tasks)) {
    return defaults;
  }

  const normalizedProjects = Array.isArray(value.projects)
    ? ensureSystemProjects(
        value.projects.flatMap((project, index) => {
          const normalizedProject = normalizeProject(project, index);

          return normalizedProject ? [normalizedProject] : [];
        }),
      )
    : [createInboxProject(), createNoProjectProject()];

  return {
    initiatives: Array.isArray(value.initiatives)
      ? value.initiatives.flatMap((initiative, index) => {
          const normalizedInitiative = normalizeInitiative(initiative, index);

          return normalizedInitiative ? [normalizedInitiative] : [];
        })
      : [],
    projects: normalizedProjects,
    tasks: value.tasks.flatMap((task, index) => {
      const normalizedTask = normalizeTask(task, index);

      return normalizedTask ? [normalizedTask] : [];
    }),
  };
}

/**
 * Migrates from the original task-only format into initiatives, projects, tasks, and threads.
 */
function migrateFromLegacyFormat(legacyTasks: unknown[]): WorkspaceSnapshot {
  const projectNameToId = new Map<string, string>();
  const projects: Project[] = [createInboxProject(), createNoProjectProject()];
  let projectCounter = 1;

  for (const task of legacyTasks) {
    if (!isRecord(task) || typeof task.project !== "string") {
      continue;
    }

    const projectName = task.project.trim();

    if (!projectName || projectNameToId.has(projectName)) {
      continue;
    }

    const projectId =
      projectName === noProjectProjectName ? noProjectProjectId : `project-${projectCounter++}`;
    projectNameToId.set(projectName, projectId);
    if (projectId !== noProjectProjectId) {
      projects.push({
        id: projectId,
        name: projectName,
        initiativeId: "",
        deadline: "",
        agentThread: createAgentThread("project", projectId),
      });
    }
  }

  const tasks: Task[] = legacyTasks.flatMap((task, index) => {
    if (!isRecord(task)) {
      return [];
    }

    const taskId = readString(task.id) || `task-${index + 1}`;
    const projectName = typeof task.project === "string" ? task.project.trim() : "";
    const projectId = normalizeTaskProjectId(projectNameToId.get(projectName));

    return [
      {
        id: taskId,
        title: readString(task.title) || "Untitled task",
        details: readString(task.details),
        completed: false,
        projectId,
        deadline: readString(task.deadline),
        tags: normalizeTags(task.tags),
        createdAt: new Date().toISOString(),
        completedAt: "",
        remindOn: "",
        dueBy: "",
        agentThread: normalizeTaskThread(task, taskId),
      },
    ];
  });

  return {
    initiatives: [],
    projects,
    tasks,
  };
}

/**
 * Normalizes one saved initiative entry.
 */
function normalizeInitiative(value: unknown, index: number): Initiative | null {
  if (!isRecord(value)) {
    return null;
  }

  const initiativeId = readString(value.id) || `initiative-${index + 1}`;

  return {
    id: initiativeId,
    name: readString(value.name) || "Untitled initiative",
    description: readString(value.description),
    deadline: readString(value.deadline),
    agentThread: normalizeAgentThread(value.agentThread, "initiative", initiativeId),
  };
}

/**
 * Normalizes one saved project entry.
 */
function normalizeProject(value: unknown, index: number): Project | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawProjectId = readString(value.id) || `project-${index + 1}`;
  const projectId = rawProjectId;

  return {
    id: projectId,
    name:
      projectId === inboxProjectId
        ? inboxProjectName
        : projectId === noProjectProjectId
          ? noProjectProjectName
        : readString(value.name) || "Untitled project",
    initiativeId: readString(value.initiativeId),
    deadline: readString(value.deadline),
    agentThread: normalizeAgentThread(value.agentThread, "project", projectId),
  };
}

/**
 * Normalizes one saved task entry and preserves compatibility with old `agentCalls` data.
 */
function normalizeTask(value: unknown, index: number): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  const taskId = readString(value.id) || `task-${index + 1}`;

  const completed = value.completed === true;

  return {
    id: taskId,
    title: readString(value.title) || "Untitled task",
    details: readString(value.details),
    completed,
    projectId: normalizeTaskProjectId(readString(value.projectId)),
    deadline: readString(value.deadline),
    tags: normalizeTags(value.tags),
    createdAt: readString(value.createdAt) || new Date().toISOString(),
    completedAt: readString(value.completedAt),
    remindOn: readString(value.remindOn),
    dueBy: readString(value.dueBy),
    agentThread: normalizeTaskThread(value, taskId),
  };
}

/**
 * Converts a task's saved thread data, falling back to legacy `agentCalls` when needed.
 */
function normalizeTaskThread(value: Record<string, unknown>, taskId: string) {
  if (isRecord(value.agentThread)) {
    return normalizeAgentThread(value.agentThread, "task", taskId);
  }

  if (Array.isArray(value.agentCalls)) {
    return createThreadFromLegacyAgentCalls(value.agentCalls, taskId);
  }

  return createAgentThread("task", taskId);
}

/**
 * Normalizes one saved thread object while forcing it to stay attached to the current entity.
 */
function normalizeAgentThread(
  value: unknown,
  ownerType: ThreadOwnerType,
  ownerId: string,
): AgentThread {
  const fallbackThread = createAgentThread(ownerType, ownerId);

  if (!isRecord(value)) {
    return fallbackThread;
  }

  return {
    id: readString(value.id) || fallbackThread.id,
    ownerType,
    ownerId,
    messages: Array.isArray(value.messages)
      ? value.messages.flatMap((message, index) => {
          const normalizedMessage = normalizeAgentThreadMessage(message, index);

          return normalizedMessage ? [normalizedMessage] : [];
        })
      : [],
  };
}

/**
 * Ensures both built-in system projects exist once saved data is normalized.
 */
function ensureSystemProjects(projects: Project[]): Project[] {
  const seenProjectIds = new Set<string>();
  const normalizedProjects: Project[] = [];

  for (const project of projects) {
    if (seenProjectIds.has(project.id)) {
      continue;
    }

    seenProjectIds.add(project.id);
    normalizedProjects.push(
      project.id === inboxProjectId
        ? {
            ...project,
            name: inboxProjectName,
          }
        : project.id === noProjectProjectId
          ? {
              ...project,
              name: noProjectProjectName,
            }
        : project,
    );
  }

  if (!seenProjectIds.has(noProjectProjectId)) {
    normalizedProjects.unshift(createNoProjectProject());
  }

  if (!seenProjectIds.has(inboxProjectId)) {
    normalizedProjects.unshift(createInboxProject());
  }

  return normalizedProjects;
}

/**
 * Converts the old task `agentCalls` shape into conversational human and agent messages.
 */
function createThreadFromLegacyAgentCalls(agentCalls: unknown[], taskId: string): AgentThread {
  const messages: AgentThreadMessage[] = [];

  for (const agentCall of agentCalls) {
    if (!isRecord(agentCall)) {
      continue;
    }

    const providerId = isProviderId(agentCall.providerId) ? agentCall.providerId : "openai";
    const model = readString(agentCall.model) || "Unknown model";
    const createdAt = readString(agentCall.createdAt) || "Unknown time";
    const brief = readString(agentCall.brief);
    const result = readOptionalString(agentCall.result);
    const error = readOptionalString(agentCall.error);

    if (brief) {
      messages.push({
        id: `message-${messages.length + 1}`,
        role: "human",
        content: brief,
        createdAt,
      });
    }

    if (result) {
      messages.push({
        id: `message-${messages.length + 1}`,
        role: "agent",
        content: result,
        createdAt,
        providerId,
        model,
        status: "done",
      });
      continue;
    }

    if (error) {
      messages.push({
        id: `message-${messages.length + 1}`,
        role: "agent",
        content: error,
        createdAt,
        providerId,
        model,
        status: "error",
      });
    }
  }

  return {
    ...createAgentThread("task", taskId),
    messages,
  };
}

/**
 * Normalizes one saved thread message so the renderer can stay resilient.
 */
function normalizeAgentThreadMessage(value: unknown, index: number): AgentThreadMessage | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: readString(value.id) || `message-${index + 1}`,
    role: normalizeThreadMessageRole(value.role),
    content: readString(value.content),
    createdAt: readString(value.createdAt) || "Unknown time",
    providerId: isProviderId(value.providerId) ? value.providerId : undefined,
    model: readOptionalString(value.model),
    status: normalizeThreadMessageStatus(value.status),
  };
}

/**
 * Normalizes tags from storage, filtering out invalid entries.
 */
function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((tag) => {
    const normalizedTag = readString(tag);

    return normalizedTag ? [normalizedTag] : [];
  });
}

/**
 * Guards thread message roles to the two renderable values.
 */
function normalizeThreadMessageRole(value: unknown): ThreadMessageRole {
  return value === "agent" ? "agent" : "human";
}

/**
 * Guards thread message status to the two supported agent result states.
 */
function normalizeThreadMessageStatus(value: unknown): ThreadMessageStatus | undefined {
  if (value === "done" || value === "error") {
    return value;
  }

  return undefined;
}

/**
 * Reads a required string field with a blank-string fallback.
 */
function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reads an optional string field and returns undefined for empty or invalid values.
 */
function readOptionalString(value: unknown) {
  const normalizedValue = readString(value);

  return normalizedValue || undefined;
}

/**
 * Keeps unknown JSON checks compact when loading local storage data.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/**
 * Clones a thread deeply enough that local state never mutates the seed data.
 */
function cloneThread(thread: AgentThread): AgentThread {
  return {
    ...thread,
    messages: thread.messages.map((message) => ({ ...message })),
  };
}

/**
 * Normalizes the task grouping mode from saved data with a fallback to the default.
 */
export function normalizeTaskGroupingMode(value: unknown): TaskGroupingMode {
  return value === "tag" ? "tag" : defaultTaskGroupingMode;
}
