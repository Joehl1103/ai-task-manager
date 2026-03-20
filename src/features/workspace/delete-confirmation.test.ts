import { describe, expect, it } from "vitest";

import {
  buildDeleteTaskConfirmationMessage,
  buildDeleteThreadMessageConfirmationMessage,
} from "@/features/workspace/tasks";

describe("delete confirmation helpers", () => {
  /**
   * Makes task deletion copy explicit when the task has no saved thread history.
   */
  it("builds a task confirmation message without thread history", () => {
    expect(
      buildDeleteTaskConfirmationMessage({
        taskTitle: "Draft a weekly review",
        messageCount: 0,
      }),
    ).toBe('Delete "Draft a weekly review"?\n\nThis will permanently remove the task.');
  });

  /**
   * Warns when deleting a task would also remove saved thread messages.
   */
  it("builds a task confirmation message with thread history", () => {
    expect(
      buildDeleteTaskConfirmationMessage({
        taskTitle: "Refine the launch checklist",
        messageCount: 2,
      }),
    ).toBe(
      'Delete "Refine the launch checklist"?\n\nThis will permanently remove the task and its 2 thread messages.',
    );
  });

  /**
   * Clarifies that deleting one thread message does not delete the parent entity.
   */
  it("builds a thread message confirmation message", () => {
    expect(
      buildDeleteThreadMessageConfirmationMessage({
        ownerType: "project",
        ownerName: "Relay MVP",
      }),
    ).toBe('Delete this thread message?\n\nThe project "Relay MVP" will stay in place.');
  });
});
