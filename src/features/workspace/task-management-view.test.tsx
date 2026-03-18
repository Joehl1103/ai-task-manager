import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { TaskManagementView } from "./task-management-view";

function buildTaskManagementViewProps() {
  return {
    tasks: workspaceSeed.tasks,
    projects: workspaceSeed.projects,
    selectedTask: null,
    selectedAgentDraft: {
      brief: "",
      error: null,
    },
    newTaskTitle: "",
    newTaskDetails: "",
    newTaskProject: "",
    newTaskDeadline: "",
    newTaskTags: "",
    editingTaskId: null,
    editTitle: "",
    editDetails: "",
    editProject: "",
    editDeadline: "",
    editTags: "",
    openAgentTaskId: null,
    pendingTaskId: null,
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    isActiveProviderReady: true,
    taskGroupingMode: "project" as const,
    onSetNewTaskTitle: vi.fn(),
    onSetNewTaskDetails: vi.fn(),
    onSetNewTaskProject: vi.fn(),
    onSetNewTaskDeadline: vi.fn(),
    onSetNewTaskTags: vi.fn(),
    onAddTask: vi.fn(),
    onOpenTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onReturnToOverview: vi.fn(),
    onStartEdit: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onDeleteAgentContribution: vi.fn(),
    onToggleAgentPanel: vi.fn(),
    onSetEditTitle: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditDeadline: vi.fn(),
    onSetEditTags: vi.fn(),
    onCloseAgentPanel: vi.fn(),
    onAgentBriefChange: vi.fn(),
    onCallAgent: vi.fn(),
    onToggleGroupingMode: vi.fn(),
    onUpdateTaskDeadline: vi.fn(),
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
    expect(markup).toContain("No project");
  });

  /**
   * Exposes an explicit grouped-view control for editing an existing deadline.
   */
  it("renders a change-deadline control in grouped rows", () => {
    const markup = renderToStaticMarkup(<TaskManagementView {...buildTaskManagementViewProps()} />);

    expect(markup).toContain("Change deadline for Define the smallest possible task manager");
  });

  /**
   * Keeps task row chips compact and adds hover color feedback for icon actions.
   */
  it("renders thin tag chips and icon buttons with hover color feedback", () => {
    const markup = renderToStaticMarkup(<TaskManagementView {...buildTaskManagementViewProps()} />);

    expect(markup).toContain("py-px");
    expect(markup).toContain('aria-label="Open task"');
    expect(markup).toContain('aria-label="Remove task"');
    expect(markup).toContain("text-[color:var(--muted)]");
    expect(markup).toContain("hover:text-[color:var(--foreground)]");
  });

  /**
   * Shows a deadline label in task drill-down when a task has a deadline.
   */
  it("renders a task deadline in drill-down", () => {
    const taskWithDeadline = {
      ...workspaceSeed.tasks[0],
      deadline: "2026-05-18",
    };
    const markup = renderToStaticMarkup(
      <TaskManagementView
        {...buildTaskManagementViewProps()}
        selectedTask={taskWithDeadline}
      />,
    );

    expect(markup).toContain("Due:");
    expect(markup).toContain("2026");
  });
});
