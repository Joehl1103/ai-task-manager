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

describe("task inline editor", () => {
  /**
   * Verifies the inline editor renders shared task fields with delete in the action bar
   * and thread icon in the header.
   */
  it("renders shared task editor fields with delete in the action bar", () => {
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
   * Confirms save, cancel, delete, and Escape are wired through to TaskEditorFields props.
   * Delete and thread are now props on TaskEditorFields rather than separate footer buttons.
   */
  it("wires save, cancel, delete, and Escape to the inline editing handlers", () => {
    const props = buildTaskInlineEditorProps();
    const tree = TaskInlineEditor(props) as ReactElement;

    // TaskInlineEditor now returns TaskEditorFields directly (no wrapping div)
    expect(tree.type).toBe(TaskEditorFields);

    const editorProps = tree.props as {
      onCancel?: () => void;
      onDelete?: () => void;
      onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
      onSubmit?: () => void;
    };

    // Verify handlers are wired
    editorProps.onSubmit?.();
    editorProps.onCancel?.();
    editorProps.onDelete?.();

    const preventDefault = vi.fn();
    editorProps.onKeyDown?.({
      key: "Escape",
      preventDefault,
    });

    expect(props.onSave).toHaveBeenCalledWith(props.task.id);
    expect(props.onDelete).toHaveBeenCalledWith(props.task.id);
    expect(props.onCancel).toHaveBeenCalledTimes(2);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that when onOpenThread is provided, the thread icon renders in the editor header.
   */
  it("passes thread props through to TaskEditorFields", () => {
    const onOpenThread = vi.fn();
    const props = {
      ...buildTaskInlineEditorProps(),
      onOpenThread,
      threadMessageCount: 5,
    };
    const markup = renderToStaticMarkup(<TaskInlineEditor {...props} />);

    expect(markup).toContain('aria-label="Open thread"');
  });
});
