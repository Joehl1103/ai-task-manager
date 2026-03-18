import { type ThreadOwnerType } from "./types";

interface DeleteTaskConfirmationInput {
  taskTitle: string;
  messageCount: number;
}

interface DeleteThreadMessageConfirmationInput {
  ownerType: ThreadOwnerType;
  ownerName: string;
}

/**
 * Builds a task-delete confirmation message that makes the scope of the destructive action explicit.
 */
export function buildDeleteTaskConfirmationMessage({
  taskTitle,
  messageCount,
}: DeleteTaskConfirmationInput) {
  const trimmedTaskTitle = taskTitle.trim() || "Untitled task";
  const messageSummary =
    messageCount === 0
      ? "This will permanently remove the task."
      : `This will permanently remove the task and its ${readMessageCountLabel(messageCount)}.`;

  return `Delete "${trimmedTaskTitle}"?\n\n${messageSummary}`;
}

/**
 * Builds a thread-message confirmation message that keeps the owning entity safe.
 */
export function buildDeleteThreadMessageConfirmationMessage({
  ownerType,
  ownerName,
}: DeleteThreadMessageConfirmationInput) {
  const trimmedOwnerName = ownerName.trim() || `Untitled ${ownerType}`;

  return `Delete this thread message?\n\nThe ${ownerType} "${trimmedOwnerName}" will stay in place.`;
}

/**
 * Keeps the thread-message count wording readable in confirmation copy.
 */
function readMessageCountLabel(messageCount: number) {
  return messageCount === 1 ? "1 thread message" : `${messageCount} thread messages`;
}
