import {
  type AddAgentThreadMessageInput,
  type AddHumanThreadMessageInput,
  type AddTaskInput,
  type AgentThread,
  type AgentThreadMessage,
  type Task,
  type ThreadOwnerRef,
  type UpdateTaskInput,
  type WorkspaceSnapshot,
} from "@/features/workspace/core";
import { normalizeTaskProjectId } from "@/features/workspace/projects";
import { createAgentThread } from "@/features/workspace/threads";

/**
 * Normalizes tags by trimming, removing duplicates case-insensitively, and filtering empty strings.
 */
function normalizeTags(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const trimmedTag = tag.trim();

    if (trimmedTag && !seen.has(trimmedTag.toLowerCase())) {
      seen.add(trimmedTag.toLowerCase());
      normalized.push(trimmedTag);
    }
  }

  return normalized;
}

/**
 * Normalizes a task deadline string for lightweight local storage and date input controls.
 */
function normalizeDeadline(deadline: string | undefined): string {
  return deadline?.trim() ?? "";
}

/**
 * Adds a new task to the front of the task list so fresh tasks are immediately visible.
 */
export function addTask(
  workspace: WorkspaceSnapshot,
  input: AddTaskInput,
): WorkspaceSnapshot {
  const nextTaskId = buildNextTaskId(workspace.tasks);
  const nextTask: Task = {
    id: nextTaskId,
    title: input.title.trim(),
    details: input.details.trim(),
    projectId: normalizeTaskProjectId(input.projectId),
    deadline: normalizeDeadline(input.deadline),
    tags: normalizeTags(input.tags),
    agentThread: createAgentThread("task", nextTaskId),
  };

  return {
    ...workspace,
    tasks: [nextTask, ...workspace.tasks],
  };
}

/**
 * Updates the title, details, projectId, and tags for a task so inline editing can stay simple.
 */
export function updateTask(
  workspace: WorkspaceSnapshot,
  input: UpdateTaskInput,
): WorkspaceSnapshot {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === input.taskId
        ? {
            ...task,
            title: input.title.trim(),
            details: input.details.trim(),
            projectId:
              input.projectId !== undefined
                ? normalizeTaskProjectId(input.projectId)
                : task.projectId,
            deadline:
              input.deadline !== undefined ? normalizeDeadline(input.deadline) : task.deadline,
            tags: input.tags !== undefined ? normalizeTags(input.tags) : task.tags,
          }
        : task,
    ),
  };
}

/**
 * Updates only the deadline for a task from compact grouped-view controls.
 */
export function updateTaskDeadline(
  workspace: WorkspaceSnapshot,
  taskId: string,
  deadline: string,
): WorkspaceSnapshot {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === taskId ? { ...task, deadline: normalizeDeadline(deadline) } : task,
    ),
  };
}

/**
 * Removes a task entirely from the list when the user deletes it.
 */
export function deleteTask(
  workspace: WorkspaceSnapshot,
  taskId: string,
): WorkspaceSnapshot {
  return {
    ...workspace,
    tasks: workspace.tasks.filter((task) => task.id !== taskId),
  };
}

/**
 * Deletes one saved thread message from the requested owner without touching other entities.
 */
export function deleteThreadMessage(
  workspace: WorkspaceSnapshot,
  owner: ThreadOwnerRef,
  messageId: string,
): WorkspaceSnapshot {
  return updateOwnerThread(workspace, owner, (thread) => ({
    ...thread,
    messages: thread.messages.filter((message) => message.id !== messageId),
  }));
}

/**
 * Appends a human-authored message to an entity thread.
 */
export function appendHumanThreadMessage(
  workspace: WorkspaceSnapshot,
  input: AddHumanThreadMessageInput,
): WorkspaceSnapshot {
  return updateOwnerThread(workspace, input.owner, (thread) => ({
    ...thread,
    messages: [
      ...thread.messages,
      buildHumanThreadMessage(thread, input.content, input.now),
    ],
  }));
}

/**
 * Appends an agent-authored reply or error message to an entity thread.
 */
export function appendAgentThreadMessage(
  workspace: WorkspaceSnapshot,
  input: AddAgentThreadMessageInput,
): WorkspaceSnapshot {
  return updateOwnerThread(workspace, input.owner, (thread) => ({
    ...thread,
    messages: [
      ...thread.messages,
      buildAgentThreadMessage(thread, input),
    ],
  }));
}

/**
 * Builds a stable incremental task id so local edits stay predictable during prototyping.
 */
function buildNextTaskId(tasks: Task[]) {
  const nextNumber = tasks.reduce((highestNumber, task) => {
    const currentNumber = Number(task.id.replace("task-", ""));

    return Number.isNaN(currentNumber)
      ? highestNumber
      : Math.max(highestNumber, currentNumber);
  }, 0);

  return `task-${nextNumber + 1}`;
}

/**
 * Updates the thread that belongs to a task, project, or initiative owner.
 */
function updateOwnerThread(
  workspace: WorkspaceSnapshot,
  owner: ThreadOwnerRef,
  updateThread: (thread: AgentThread) => AgentThread,
): WorkspaceSnapshot {
  if (owner.ownerType === "task") {
    return {
      ...workspace,
      tasks: workspace.tasks.map((task) =>
        task.id === owner.ownerId
          ? {
              ...task,
              agentThread: updateThread(task.agentThread),
            }
          : task,
      ),
    };
  }

  if (owner.ownerType === "project") {
    return {
      ...workspace,
      projects: workspace.projects.map((project) =>
        project.id === owner.ownerId
          ? {
              ...project,
              agentThread: updateThread(project.agentThread),
            }
          : project,
      ),
    };
  }

  return {
    ...workspace,
    initiatives: workspace.initiatives.map((initiative) =>
      initiative.id === owner.ownerId
        ? {
            ...initiative,
            agentThread: updateThread(initiative.agentThread),
          }
        : initiative,
    ),
  };
}

/**
 * Creates one human thread message with a stable local id.
 */
function buildHumanThreadMessage(thread: AgentThread, content: string, now: string): AgentThreadMessage {
  return {
    id: buildNextThreadMessageId(thread),
    role: "human",
    content: content.trim(),
    createdAt: now,
  };
}

/**
 * Creates one agent thread message with provider metadata and status.
 */
function buildAgentThreadMessage(
  thread: AgentThread,
  input: AddAgentThreadMessageInput,
): AgentThreadMessage {
  return {
    id: buildNextThreadMessageId(thread),
    role: "agent",
    content: input.content.trim(),
    createdAt: input.now,
    providerId: input.providerId,
    model: input.model.trim(),
    status: input.status,
  };
}

/**
 * Finds the next numeric message id without reusing ids after deletions.
 */
function buildNextThreadMessageId(thread: AgentThread) {
  const nextNumber = thread.messages.reduce((highestNumber, message) => {
    const currentNumber = Number(message.id.replace("message-", ""));

    return Number.isNaN(currentNumber)
      ? highestNumber
      : Math.max(highestNumber, currentNumber);
  }, 0);

  return `message-${nextNumber + 1}`;
}
