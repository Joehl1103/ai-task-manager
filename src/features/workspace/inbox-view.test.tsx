import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { InboxView } from "./inbox-view";

function buildInboxViewProps() {
  return {
    tasks: workspaceSeed.tasks,
    projects: workspaceSeed.projects,
    selectedTask: null,
    selectedThreadDraft: {
      message: "",
      error: null,
    },
    newTaskTitle: "",
    newTaskDetails: "",
    newTaskProject: "",
    newTaskTags: "",
    editingTaskId: null,
    editTitle: "",
    editDetails: "",
    editProject: "",
    editTags: "",
    pendingTaskId: null,
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    isActiveProviderReady: true,
    onSetNewTaskTitle: vi.fn(),
    onSetNewTaskDetails: vi.fn(),
    onSetNewTaskProject: vi.fn(),
    onSetNewTaskTags: vi.fn(),
    onAddTask: vi.fn(),
    onOpenTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onReturnToOverview: vi.fn(),
    onStartEdit: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onDeleteThreadMessage: vi.fn(),
    onSetEditTitle: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditTags: vi.fn(),
    onThreadDraftChange: vi.fn(),
    onSendThreadMessage: vi.fn(),
  };
}

describe("inbox view", () => {
  /**
   * Keeps the collapsed add-task affordance light by removing the boxed shell and helper copy.
   */
  it("renders a line-first add-task trigger when the composer is collapsed", () => {
    const markup = renderToStaticMarkup(<InboxView {...buildInboxViewProps()} />);

    expect(markup).toContain("Add task");
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
  });

  /**
   * Hides the internal inbox project id from the task reassignment picker.
   */
  it("keeps the inbox project out of the project picker", () => {
    const selectedTask = workspaceSeed.tasks.find((task) => task.id === "task-3") ?? null;
    const markup = renderToStaticMarkup(
      <InboxView
        {...buildInboxViewProps()}
        selectedTask={selectedTask}
        editingTaskId="task-3"
        editTitle="Review quarterly goals"
        editDetails="Compare current progress against initial targets."
        editProject=""
        editTags="review"
      />,
    );

    expect(markup).toContain('value="project-1"');
    expect(markup).toContain('value="project-2"');
    expect(markup).toContain('value="project-no-project"');
    expect(markup).not.toContain('value="project-inbox"');
    expect(markup).toContain(">Keep in Inbox</option>");
    expect(markup).toContain(">No Project</option>");
  });
});
