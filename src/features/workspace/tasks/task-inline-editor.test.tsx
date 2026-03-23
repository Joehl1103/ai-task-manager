import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "@/features/workspace/mock-data";
import { filterVisibleProjects } from "@/features/workspace/projects";

import { TaskEditorFields } from "./task-editor-fields";
import { TaskInlineEditor } from "./task-inline-editor";
import { collectTaskTags } from "./task-tag-combobox";

function buildTaskInlineEditorProps() {
  const task = workspaceSeed.tasks.find((candidate) => candidate.id === "task-1");

  if (!task) {
    throw new Error("Expected seeded task-1 to exist for task inline editor tests.");
  }

  return {
    allTags: collectTaskTags(workspaceSeed.tasks),
    editDetails: task.details,
    editDueBy: task.dueBy,
    editProject: task.projectId,
    editRemindOn: task.remindOn,
    editTags: task.tags.join(", "),
    editTitle: task.title,
    onCancel: vi.fn(),
    onDelete: vi.fn(),
    onSave: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditDueBy: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditRemindOn: vi.fn(),
    onSetEditTags: vi.fn(),
    onSetEditTitle: vi.fn(),
    projects: filterVisibleProjects(workspaceSeed.projects),
    task,
  };
}

/**
 * Walks the returned React element tree so the tests can inspect prop wiring without a DOM.
 */
function findElement(
  node: ReactNode,
  predicate: (element: ReactElement) => boolean,
): ReactElement | null {
  if (!isValidElement(node)) {
    return null;
  }

  if (predicate(node)) {
    return node;
  }

  for (const child of Children.toArray(node.props.children)) {
    const match = findElement(child, predicate);

    if (match) {
      return match;
    }
  }

  return null;
}

describe("task inline editor", () => {
  /**
   * Verifies the inline editor keeps the shared no-chrome task fields while adding the quiet
   * delete affordance requested for the inline editing flow.
   */
  it("renders shared task editor fields plus a footer delete action", () => {
    const markup = renderToStaticMarkup(<TaskInlineEditor {...buildTaskInlineEditorProps()} />);

    expect(markup).toContain("Task title");
    expect(markup).toContain("Add details...");
    expect(markup).toContain("Add tag");
    expect(markup).toContain('aria-label="Remind on"');
    expect(markup).toContain('aria-label="Due by"');
    expect(markup).toContain("Cancel");
    expect(markup).toContain("Save");
    expect(markup).toContain("Delete");
    expect(markup).toContain("⌘↵");
    expect(markup).not.toContain(">Back<");
  });

  /**
   * Confirms the wrapper keeps save, cancel, delete, and Escape wired to the task-level handlers.
   */
  it("wires save, cancel, delete, and Escape to the inline editing handlers", () => {
    const props = buildTaskInlineEditorProps();
    const tree = TaskInlineEditor(props);
    const editorFields = findElement(
      tree,
      (element) => element.type === TaskEditorFields,
    ) as ReactElement<{
      onCancel?: () => void;
      onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
      onSubmit?: () => void;
    }> | null;
    const deleteButton = findElement(
      tree,
      (element) =>
        element.type === "button" &&
        Children.toArray(element.props.children).join("").includes("Delete"),
    ) as ReactElement<{ onClick?: () => void }> | null;

    expect(editorFields).not.toBeNull();
    expect(deleteButton).not.toBeNull();

    editorFields?.props.onSubmit?.();
    editorFields?.props.onCancel?.();
    deleteButton?.props.onClick?.();

    const preventDefault = vi.fn();
    editorFields?.props.onKeyDown?.({
      key: "Escape",
      preventDefault,
    });

    expect(props.onSave).toHaveBeenCalledWith(props.task.id);
    expect(props.onDelete).toHaveBeenCalledWith(props.task.id);
    expect(props.onCancel).toHaveBeenCalledTimes(2);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });
});
