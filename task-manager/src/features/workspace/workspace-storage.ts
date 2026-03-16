import { workspaceSeed } from "./mock-data";
import { isProviderId } from "./provider-config";
import {
  type AgentCall,
  type AgentCallStatus,
  type Task,
  type WorkspaceSnapshot,
} from "./types";

export const workspaceStorageKey = "relay-workspace";

/**
 * Creates a fresh copy of the seed workspace so local state never mutates shared module data.
 */
export function createDefaultWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    tasks: workspaceSeed.tasks.map((task) => ({
      ...task,
      agentCalls: task.agentCalls.map((agentCall) => ({
        ...agentCall,
      })),
    })),
  };
}

/**
 * Normalizes saved workspace data so malformed local storage entries do not break the task UI.
 */
export function normalizeWorkspaceSnapshot(value: unknown): WorkspaceSnapshot {
  const defaults = createDefaultWorkspaceSnapshot();

  if (!isRecord(value) || !Array.isArray(value.tasks)) {
    return defaults;
  }

  return {
    tasks: value.tasks.flatMap((task, index) => {
      const normalizedTask = normalizeTask(task, index);

      return normalizedTask ? [normalizedTask] : [];
    }),
  };
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
    project: readString(value.project),
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
