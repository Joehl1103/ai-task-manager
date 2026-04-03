import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { InboxView } from "./inbox-view";

function buildInboxViewProps() {
  return {
    tasks: workspaceSeed.tasks,
    projects: workspaceSeed.projects,
    focusTitleInputSignal: 0,
    editingTaskId: null,
    editTitle: "",
    editDetails: "",
    editDueBy: "",
    editProject: "",
    editRemindOn: "",
    editTags: "",
    onAddTask: vi.fn(),
    onOpenTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onSetEditTitle: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditDueBy: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditRemindOn: vi.fn(),
    onSetEditTags: vi.fn(),
    onToggleTaskCompleted: vi.fn(),
  };
}

describe("inbox view", () => {
  /**
   * Keeps the collapsed add-task affordance light by removing the boxed shell and helper copy.
   */
  it("renders a line-first add-task trigger when the composer is collapsed", () => {
    const markup = renderToStaticMarkup(<InboxView {...buildInboxViewProps()} />);

    expect(markup).toContain("+ Add task");
    expect(markup).not.toContain("Click to open the full task composer.");
    expect(markup).not.toContain("border-b border-[color:var(--border)]");
    expect(markup).not.toContain("rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3");
  });

  /**
   * Shows only inbox-assigned tasks in the dedicated inbox list.
   */
  it("renders only inbox tasks in the overview list", () => {
    const markup = renderToStaticMarkup(<InboxView {...buildInboxViewProps()} />);

    expect(markup).toContain("Review quarterly goals");
    expect(markup).not.toContain("Define the smallest possible task manager");
    expect(markup).not.toContain("List the next three product decisions");
    expect(markup).toContain('data-slot="separator"');
  });

  /**
   * Keeps the hidden inbox project out of the visible reassignment picker even after the native
   * select was replaced with the shared Radix-backed primitive.
   */
  it("keeps the inbox project out of the project picker", () => {
    const markup = renderToStaticMarkup(
      <InboxView
        {...buildInboxViewProps()}
        editingTaskId="task-3"
        editTitle="Review quarterly goals"
        editDetails="Compare current progress against initial targets."
        editDueBy="2026-03-30"
        editProject=""
        editRemindOn="2026-03-28"
        editTags="review"
      />,
    );

    expect(markup).toContain('data-slot="select-trigger"');
    expect(markup).toContain('aria-label="Remind on"');
    expect(markup).toContain('aria-label="Due by"');
    expect(markup).toContain("Delete");
    expect(markup).toContain("Review quarterly goals");
    expect(markup).not.toContain('value="project-inbox"');
    expect(markup).not.toContain(">Inbox</option>");
    expect(markup).not.toContain("<option");
  });
});
