import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "@/features/workspace/mock-data";
import { filterVisibleProjects } from "@/features/workspace/projects";

import { TaskDrillDown } from "./task-drill-down";
import { collectTaskTags } from "./task-tag-combobox";

function buildTaskDrillDownProps() {
  const task = workspaceSeed.tasks.find((candidate) => candidate.id === "task-1");

  if (!task) {
    throw new Error("Expected seeded task-1 to exist for task drill-down tests.");
  }

  return {
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    allTags: collectTaskTags(workspaceSeed.tasks),
    editDetails: task.details,
    editingTaskId: null,
    editProject: task.projectId,
    editTags: task.tags.join(", "),
    editTitle: task.title,
    onCancelEdit: vi.fn(),
    onDeleteThreadMessage: vi.fn(),
    onDeleteTask: vi.fn(),
    onReturnToOverview: vi.fn(),
    onSaveEdit: vi.fn(),
    onSendThreadMessage: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditTags: vi.fn(),
    onSetEditTitle: vi.fn(),
    onStartEdit: vi.fn(),
    onThreadDraftChange: vi.fn(),
    pendingTaskId: null,
    projects: filterVisibleProjects(workspaceSeed.projects),
    task,
    threadDraft: {
      message: "",
      error: null,
    },
  };
}

describe("task drill-down", () => {
  /**
   * Keeps the non-editing state focused on the selected task details and quiet metadata.
   */
  it("renders task details in a shared drill-down surface", () => {
    const markup = renderToStaticMarkup(<TaskDrillDown {...buildTaskDrillDownProps()} />);

    expect(markup).toContain("Define the smallest possible task manager");
    expect(markup).toContain("Relay MVP");
    expect(markup).toContain("Keep only create, edit, delete, and call-agent actions.");
    expect(markup).toContain('aria-label="Task actions"');
    expect(markup).toContain(">Back<");
    expect(markup).not.toContain("Add tag");
  });

  /**
   * Verifies edit mode reuses the no-chrome composer language rather than the older boxed inputs.
   */
  it("renders shared no-chrome editor fields when editing", () => {
    const props = buildTaskDrillDownProps();
    const markup = renderToStaticMarkup(
      <TaskDrillDown {...props} editingTaskId={props.task.id} />,
    );

    expect(markup).toContain("Task title");
    expect(markup).toContain("Add details...");
    expect(markup).toContain("Add tag");
    expect(markup).toContain('aria-label="Remove planning tag"');
    expect(markup).toContain("Cancel");
    expect(markup).toContain("Save");
    expect(markup).toContain("⌘↵");
    expect(markup).toContain('data-slot="select-trigger"');
    expect(markup).not.toContain("Tags (optional, comma-separated)");
  });
});
