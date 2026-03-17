import { workspaceSeed } from "./mock-data";
import { isProviderId } from "./provider-config";
import {
  type AgentCall,
  type AgentCallStatus,
  type Initiative,
  type Project,
  type Task,
  type WorkspaceSnapshot,
} from "./types";

export const workspaceStorageKey = "relay-workspace";
export const taskGroupingModeStorageKey = "relay-task-grouping-mode";

export type TaskGroupingMode = "project" | "tag";

export const defaultTaskGroupingMode: TaskGroupingMode = "project";

/**
 * Creates a fresh copy of the seed workspace so local state never mutates shared module data.
 */
export function createDefaultWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    initiatives: workspaceSeed.initiatives.map((initiative) => ({ ...initiative })),
    projects: workspaceSeed.projects.map((project) => ({ ...project })),
    tasks: workspaceSeed.tasks.map((task) => ({
      ...task,
      agentCalls: task.agentCalls.map((agentCall) => ({
        ...agentCall,
      })),
    })),
  };
}

/**
 * Normalizes saved workspace data so malformed local storage entries do not break the UI.
 * Handles migration from old format (tasks with project string) to new format (initiatives, projects, tasks).
 */
export function normalizeWorkspaceSnapshot(value: unknown): WorkspaceSnapshot {
  const defaults = createDefaultWorkspaceSnapshot();

  if (!isRecord(value)) {
    return defaults;
  }

  // Check if this is old format (tasks with project string instead of projectId)
  const needsMigration = Array.isArray(value.tasks) && 
    value.tasks.length > 0 && 
    !Array.isArray(value.projects) &&
    isRecord(value.tasks[0]) &&
    typeof value.tasks[0].project === "string" &&
    value.tasks[0].projectId === undefined;

  if (needsMigration) {
    return migrateFromLegacyFormat(value.tasks as unknown[]);
  }

  // Handle new format
  if (!Array.isArray(value.tasks)) {
    return defaults;
  }

  return {
    initiatives: Array.isArray(value.initiatives)
      ? value.initiatives.flatMap((initiative, index) => {
          const normalized = normalizeInitiative(initiative, index);
          return normalized ? [normalized] : [];
        })
      : [],
    projects: Array.isArray(value.projects)
      ? value.projects.flatMap((project, index) => {
          const normalized = normalizeProject(project, index);
          return normalized ? [normalized] : [];
        })
      : [],
    tasks: value.tasks.flatMap((task, index) => {
      const normalizedTask = normalizeTask(task, index);
      return normalizedTask ? [normalizedTask] : [];
    }),
  };
}

/**
 * Migrates from old format (tasks with project string) to new format.
 */
function migrateFromLegacyFormat(legacyTasks: unknown[]): WorkspaceSnapshot {
  const projectNameToId = new Map<string, string>();
  const projects: Project[] = [];
  let projectCounter = 1;

  // First pass: collect unique project names and create Project entities
  for (const task of legacyTasks) {
    if (isRecord(task) && typeof task.project === "string" && task.project.trim()) {
      const projectName = task.project.trim();
      if (!projectNameToId.has(projectName)) {
        const projectId = `project-${projectCounter++}`;
        projectNameToId.set(projectName, projectId);
        projects.push({
          id: projectId,
          name: projectName,
          initiativeId: "",
          deadline: "",
        });
      }
    }
  }

  // Second pass: normalize tasks with projectId references
  const tasks: Task[] = legacyTasks.flatMap((task, index) => {
    if (!isRecord(task)) return [];

    const projectName = typeof task.project === "string" ? task.project.trim() : "";
    const projectId = projectNameToId.get(projectName) || "";

    return [{
      id: readString(task.id) || `task-${index + 1}`,
      title: readString(task.title) || "Untitled task",
      details: readString(task.details),
      projectId,
      tags: normalizeTags(task.tags),
      agentCalls: Array.isArray(task.agentCalls)
        ? task.agentCalls.flatMap((agentCall, agentCallIndex) => {
            const normalized = normalizeAgentCall(agentCall, agentCallIndex);
            return normalized ? [normalized] : [];
          })
        : [],
    }];
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

  return {
    id: readString(value.id) || `initiative-${index + 1}`,
    name: readString(value.name) || "Untitled initiative",
    description: readString(value.description),
    deadline: readString(value.deadline),
  };
}

/**
 * Normalizes one saved project entry.
 */
function normalizeProject(value: unknown, index: number): Project | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: readString(value.id) || `project-${index + 1}`,
    name: readString(value.name) || "Untitled project",
    initiativeId: readString(value.initiativeId),
    deadline: readString(value.deadline),
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
    const normalized = readString(tag);

    return normalized ? [normalized] : [];
  });
}

/**
 * Normalizes one saved task entry and applies lightweight fallbacks for missing fields.
 */
function normalizeTask(value: unknown, index: number): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: readString(value.id) || `task-${index + 1}`,
    title: readString(value.title) || "Untitled task",
    details: readString(value.details),
    projectId: readString(value.projectId),
    tags: normalizeTags(value.tags),
    agentCalls: Array.isArray(value.agentCalls)
      ? value.agentCalls.flatMap((agentCall, agentCallIndex) => {
          const normalizedAgentCall = normalizeAgentCall(agentCall, agentCallIndex);

          return normalizedAgentCall ? [normalizedAgentCall] : [];
        })
      : [],
  };
}

/**
 * Normalizes one saved agent call entry so task history remains render-safe.
 */
function normalizeAgentCall(value: unknown, index: number): AgentCall | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: readString(value.id) || `call-${index + 1}`,
    providerId: isProviderId(value.providerId) ? value.providerId : "openai",
    model: readString(value.model) || "Unknown model",
    brief: readString(value.brief),
    status: normalizeAgentCallStatus(value.status),
    createdAt: readString(value.createdAt) || "Unknown time",
    result: readOptionalString(value.result),
    error: readOptionalString(value.error),
  };
}

/**
 * Guards the saved agent call status to the two states the UI knows how to display.
 */
function normalizeAgentCallStatus(value: unknown): AgentCallStatus {
  return value === "done" || value === "error" ? value : "error";
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
 * Normalizes the task grouping mode from saved data with a fallback to the default.
 */
export function normalizeTaskGroupingMode(value: unknown): TaskGroupingMode {
  return value === "tag" ? "tag" : defaultTaskGroupingMode;
}
