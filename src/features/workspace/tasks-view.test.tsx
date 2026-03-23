import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { TasksView } from "./tasks-view";

function buildTasksViewProps() {
  return {
    tasks: workspaceSeed.tasks,
    projects: workspaceSeed.projects,
    editingTaskId: null,
    editTitle: "",
    editDetails: "",
    editDueBy: "",
    editProject: "",
    editRemindOn: "",
    editTags: "",
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
    onAddTask: vi.fn(),
    onToggleTaskCompleted: vi.fn(),
  };
}

describe("tasks view", () => {
  it("renders tasks heading and filters", () => {
    const markup = renderToStaticMarkup(<TasksView {...buildTasksViewProps()} />);

    expect(markup).toContain("Tasks");
    expect(markup).toContain("Project:");
    expect(markup).toContain("Due by:");
    expect(markup).toContain("Remind on:");
  });

  it("renders grouping toggle", () => {
    const markup = renderToStaticMarkup(<TasksView {...buildTasksViewProps()} />);

    expect(markup).toContain("Grouped by");
    expect(markup).toContain("Project");
    expect(markup).toContain("Tag");
  });

  it("renders right-side due-by and remind-on labels when present", () => {
    const markup = renderToStaticMarkup(
      <TasksView
        {...buildTasksViewProps()}
        tasks={[
          {
            ...workspaceSeed.tasks[0]!,
            id: "task-with-due",
            title: "Date badge task",
            dueBy: "2026-03-23",
            remindOn: "2026-03-25",
          },
        ]}
      />,
    );

    expect(markup).toContain("w-[700px]");
    expect(markup).toContain("Due by Mar 23");
    expect(markup).toContain("Remind on Mar 25");
  });

  it("shows empty state when no tasks are present", () => {
    const markup = renderToStaticMarkup(<TasksView {...buildTasksViewProps()} tasks={[]} />);

    expect(markup).toContain("No tasks yet.");
  });
});
