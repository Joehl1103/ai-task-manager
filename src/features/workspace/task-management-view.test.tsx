import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { TaskManagementView } from "./task-management-view";

function buildTaskManagementViewProps() {
  return {
    tasks: workspaceSeed.tasks,
    projects: workspaceSeed.projects,
    selectedTask: null,
    selectedThreadDraft: {
      message: "",
      error: null,
    },
    activeProjectFilterName: null,
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
    taskGroupingMode: "project" as const,
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
    onClearProjectFilter: vi.fn(),
    onThreadDraftChange: vi.fn(),
    onSendThreadMessage: vi.fn(),
    onToggleGroupingMode: vi.fn(),
  };
}

describe("task management view", () => {
  /**
   * Renders tasks grouped by project with minimalist line items.
   */
  it("renders task rows as minimalist line items grouped by project", () => {
    const markup = renderToStaticMarkup(<TaskManagementView {...buildTaskManagementViewProps()} />);

    expect(markup).toContain("task-overview-line-item");
    expect(markup).toContain("Relay MVP");
    expect(markup).toContain("Inbox");
  });

  /**
   * Keeps task row chips compact while moving secondary actions into a quieter menu trigger.
   */
  it("renders thin tag chips and task action menu triggers", () => {
    const markup = renderToStaticMarkup(<TaskManagementView {...buildTaskManagementViewProps()} />);

    expect(markup).toContain("py-px");
    expect(markup).toContain('aria-label="Task actions"');
    expect(markup).toContain('data-slot="dropdown-menu-trigger"');
    expect(markup).toContain('data-slot="separator"');
    expect(markup).toContain("text-[color:var(--muted)]");
    expect(markup).toContain("hover:text-[color:var(--foreground)]");
  });

  /**
   * Shows the active project filter so project-driven navigation stays visible and reversible.
   */
  it("renders the active project filter when tasks are scoped to one project", () => {
    const markup = renderToStaticMarkup(
      <TaskManagementView
        {...buildTaskManagementViewProps()}
        activeProjectFilterName="Relay MVP"
      />,
    );

    expect(markup).toContain("Filtered by: Relay MVP");
    expect(markup).toContain("Clear");
  });
});
