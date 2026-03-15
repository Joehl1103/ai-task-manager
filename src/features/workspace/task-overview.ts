import { type AgentCallStatus, type Task } from "./types";

const defaultDetailsPreviewLength = 96;

export interface TaskOverviewSummary {
  detailsPreview: string;
  agentCallCount: number;
  latestAgentStatus: AgentCallStatus | null;
  latestAgentTimestamp: string | null;
}

/**
 * Builds the compact task summary used by the overview list.
 */
export function buildTaskOverviewSummary(task: Task): TaskOverviewSummary {
  const latestAgentCall = task.agentCalls[0];

  return {
    detailsPreview: buildTaskDetailsPreview(task.details),
    agentCallCount: task.agentCalls.length,
    latestAgentStatus: latestAgentCall?.status ?? null,
    latestAgentTimestamp: latestAgentCall?.createdAt ?? null,
  };
}

/**
 * Truncates task details so overview cards stay compact and predictable.
 */
export function buildTaskDetailsPreview(
  details: string,
  maxLength = defaultDetailsPreviewLength,
) {
  const normalizedDetails = details.trim();

  if (!normalizedDetails) {
    return "No details yet.";
  }

  if (normalizedDetails.length <= maxLength) {
    return normalizedDetails;
  }

  const clippedDetails = normalizedDetails.slice(0, maxLength).trimEnd();
  const lastWordBoundary = clippedDetails.lastIndexOf(" ");
  const wordSafePreview =
    lastWordBoundary > 0 ? clippedDetails.slice(0, lastWordBoundary).trimEnd() : clippedDetails;

  return `${wordSafePreview}...`;
}

/**
 * Reads the selected task from the current workspace snapshot.
 */
export function readSelectedTask(tasks: Task[], taskId: string | null) {
  if (!taskId) {
    return null;
  }

  return tasks.find((task) => task.id === taskId) ?? null;
}
