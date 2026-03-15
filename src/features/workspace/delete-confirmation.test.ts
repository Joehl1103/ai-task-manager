import { describe, expect, it } from "vitest";

import {
  buildDeleteAgentContributionConfirmationMessage,
  buildDeleteTaskConfirmationMessage,
} from "./delete-confirmation";

describe("delete confirmation helpers", () => {
  /**
   * Makes task deletion copy explicit when the task has no saved agent history.
   */
  it("builds a task confirmation message without contribution history", () => {
    expect(
      buildDeleteTaskConfirmationMessage({
        taskTitle: "Draft a weekly review",
        agentCallCount: 0,
      }),
    ).toBe('Delete "Draft a weekly review"?\n\nThis will permanently remove the task.');
  });

  /**
   * Warns when deleting a task would also remove saved agent contributions.
   */
  it("builds a task confirmation message with contribution history", () => {
    expect(
      buildDeleteTaskConfirmationMessage({
        taskTitle: "Refine the launch checklist",
        agentCallCount: 2,
      }),
    ).toBe(
      'Delete "Refine the launch checklist"?\n\nThis will permanently remove the task and its 2 saved agent contributions.',
    );
  });

  /**
   * Clarifies that deleting one agent contribution does not delete the task.
   */
  it("builds an agent contribution confirmation message", () => {
    expect(
      buildDeleteAgentContributionConfirmationMessage({
        taskTitle: "Plan the kickoff",
      }),
    ).toBe('Delete this agent contribution?\n\nThe task "Plan the kickoff" will stay in place.');
  });
});
