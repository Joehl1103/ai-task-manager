interface DeleteTaskConfirmationInput {
  taskTitle: string;
  agentCallCount: number;
}

interface DeleteAgentContributionConfirmationInput {
  taskTitle: string;
}

/**
 * Builds a task-delete confirmation message that makes the scope of the destructive action explicit.
 */
export function buildDeleteTaskConfirmationMessage({
  taskTitle,
  agentCallCount,
}: DeleteTaskConfirmationInput) {
  const trimmedTaskTitle = taskTitle.trim() || "Untitled task";
  const contributionMessage =
    agentCallCount === 0
      ? "This will permanently remove the task."
      : `This will permanently remove the task and its ${readContributionCountLabel(agentCallCount)}.`;

  return `Delete "${trimmedTaskTitle}"?\n\n${contributionMessage}`;
}

/**
 * Builds an agent-contribution confirmation message that keeps the task itself safe.
 */
export function buildDeleteAgentContributionConfirmationMessage({
  taskTitle,
}: DeleteAgentContributionConfirmationInput) {
  const trimmedTaskTitle = taskTitle.trim() || "Untitled task";

  return `Delete this agent contribution?\n\nThe task "${trimmedTaskTitle}" will stay in place.`;
}

/**
 * Keeps the contribution count wording readable in confirmation copy.
 */
function readContributionCountLabel(agentCallCount: number) {
  return agentCallCount === 1 ? "saved agent contribution" : `${agentCallCount} saved agent contributions`;
}
