import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { TaskManagementView } from "./task-management-view";

function buildTaskManagementViewProps() {
  return {
    tasks: workspaceSeed.tasks,
    projects: workspaceSeed.projects,
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
    taskGroupingMode: "project" as const,
    onSetNewTaskTitle: vi.fn(),
    onSetNewTaskDetails: vi.fn(),
    onSetNewTaskProject: vi.fn(),
    onSetNewTaskTags: vi.fn(),
    onAddTask: vi.fn(),
    onOpenTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onSetEditTitle: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditTags: vi.fn(),
    onClearProjectFilter: vi.fn(),
    onToggleGroupingMode: vi.fn(),
    onToggleTaskCompleted: vi.fn(),
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
   * Keeps task row chips compact with thin tag pills and separator dividers.
   */
  it("renders thin tag chips and row separators", () => {
    const markup = renderToStaticMarkup(<TaskManagementView {...buildTaskManagementViewProps()} />);

    expect(markup).toContain("py-px");
    expect(markup).toContain('data-slot="separator"');
    expect(markup).toContain("text-[color:var(--muted)]");
    expect(markup).toContain("hover:text-[color:var(--foreground)]");
  });

  /**
   * Confirms opening a task now expands the shared editor inline while preserving the grouped list.
   */
  it("renders the inline editor beneath the matching task row", () => {
    const markup = renderToStaticMarkup(
      <TaskManagementView
        {...buildTaskManagementViewProps()}
        editingTaskId="task-1"
        editTitle="Define the smallest possible task manager"
        editDetails="Keep only create, edit, delete, and call-agent actions."
        editProject="project-1"
        editTags="planning"
      />,
    );

    expect(markup).toContain("Task title");
    expect(markup).toContain("Delete");
    expect(markup).toContain("List the next three product decisions");
    expect(markup).not.toContain(">Back<");
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
