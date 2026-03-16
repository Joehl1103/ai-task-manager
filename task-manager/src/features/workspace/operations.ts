import {
  type AddTaskInput,
  type AgentCall,
  type CallAgentInput,
  type Task,
  type UpdateTaskInput,
  type WorkspaceSnapshot,
} from "./types";

/**
 * Adds a new task to the front of the task list so fresh tasks are immediately visible.
 */
export function addTask(
  workspace: WorkspaceSnapshot,
  input: AddTaskInput,
): WorkspaceSnapshot {
  const nextTask: Task = {
    id: buildNextTaskId(workspace.tasks),
    title: input.title.trim(),
    details: input.details.trim(),
    project: input.project?.trim() ?? "",
    agentCalls: [],
  };

  return {
    ...workspace,
    tasks: [nextTask, ...workspace.tasks],
  };
}

/**
 * Updates the title and details for a task so inline editing can stay simple.
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
            project: input.project?.trim() ?? task.project,
          }
        : task,
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
 * Removes one saved agent call from a task while leaving the rest of the task intact.
 */
export function deleteAgentCall(
  workspace: WorkspaceSnapshot,
  taskId: string,
  agentCallId: string,
): WorkspaceSnapshot {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            agentCalls: task.agentCalls.filter((agentCall) => agentCall.id !== agentCallId),
          }
        : task,
    ),
  };
}

/**
 * Records the outcome of an agent call directly on the task that triggered it.
 */
export function recordAgentCall(
  workspace: WorkspaceSnapshot,
  input: CallAgentInput,
): WorkspaceSnapshot {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === input.taskId ? buildTaskWithAgentCall(task, input) : task,
    ),
  };
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
 * Creates a task-scoped agent call id so each task keeps its own short local history.
 */
function buildNextAgentCallId(task: Task) {
  return `call-${task.agentCalls.length + 1}`;
}

/**
 * Builds the next version of a task after an agent call is attached to it.
 */
function buildTaskWithAgentCall(task: Task, input: CallAgentInput): Task {
  const nextAgentCall: AgentCall = {
    id: buildNextAgentCallId(task),
    providerId: input.providerId,
    model: input.model,
    brief: input.brief.trim(),
    status: input.status,
    createdAt: input.now,
    result: input.result,
    error: input.error,
  };

  return {
    ...task,
    agentCalls: [nextAgentCall, ...task.agentCalls],
  };
}
