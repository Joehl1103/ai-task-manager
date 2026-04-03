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
    onOpenThreadPanel: vi.fn(),
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

  it("renders thread button with message count in task inline editor", () => {
    const taskWithMessages = {
      ...workspaceSeed.tasks[0]!,
      id: "task-1",
      agentThread: {
        id: "thread-task-task-1",
        ownerType: "task" as const,
        ownerId: "task-1",
        messages: [
          {
            id: "msg-1",
            role: "human" as const,
            content: "Hello",
            createdAt: "2026-04-01 12:00",
          },
          {
            id: "msg-2",
            role: "agent" as const,
            content: "Hi there",
            createdAt: "2026-04-01 12:01",
            providerId: "openai" as const,
            model: "gpt-4",
            status: "done" as const,
          },
        ],
      },
    };

    const markup = renderToStaticMarkup(
      <TasksView
        {...buildTasksViewProps()}
        tasks={[taskWithMessages]}
        editingTaskId="task-1"
        editTitle="Test task"
        onOpenThreadPanel={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-label="Open thread"');
  });
});
