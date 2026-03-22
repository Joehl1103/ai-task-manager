import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { ProjectDetailView, ProjectView } from "./project-view";

function buildProjectViewProps() {
  return {
    initiatives: workspaceSeed.initiatives,
    onAddProject: vi.fn(),
    onSelectProject: vi.fn(),
    projects: workspaceSeed.projects,
    tasks: workspaceSeed.tasks,
  };
}

function buildProjectDetailViewProps() {
  const task = workspaceSeed.tasks.find((candidate) => candidate.id === "task-1") ?? null;

  return {
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    editDetails: task?.details ?? "",
    editingTaskId: null,
    editProject: task?.projectId ?? "",
    editTags: task?.tags.join(", ") ?? "",
    editTitle: task?.title ?? "",
    initiatives: workspaceSeed.initiatives,
    onAddTask: vi.fn(),
    onBack: vi.fn(),
    onCancelEdit: vi.fn(),
    onDeleteProject: vi.fn(),
    onDeleteThreadMessage: vi.fn(),
    onDeleteTask: vi.fn(),
    onOpenInitiative: vi.fn(),
    onOpenTask: vi.fn(),
    onSaveEdit: vi.fn(),
    onSendThreadMessage: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditTags: vi.fn(),
    onSetEditTitle: vi.fn(),
    onThreadDraftChange: vi.fn(),
    onUpdateProject: vi.fn(),
    pendingThreadId: null,
    project: workspaceSeed.projects.find((project) => project.id === "project-1") ?? null,
    projects: workspaceSeed.projects,
    readThreadDraft: vi.fn(() => ({
      message: "",
      error: null,
    })),
    tasks: workspaceSeed.tasks,
  } as const;
}

function buildNoProjectDetailViewProps() {
  return {
    ...buildProjectDetailViewProps(),
    project:
      workspaceSeed.projects.find((project) => project.id === "project-no-project") ?? null,
  } as const;
}

describe("project view", () => {
  /**
   * Keeps the overview centered on compact cards while still previewing child task context.
   */
  it("renders clickable overview cards with task previews", () => {
    const markup = renderToStaticMarkup(<ProjectView {...buildProjectViewProps()} />);

    expect(markup).toContain("Projects");
    expect(markup).toContain("No Project");
    expect(markup).not.toContain("project-inbox");
    expect(markup).not.toContain(">Inbox<");
    expect(markup).toContain("Relay MVP");
    expect(markup).toContain("Define the smallest possible task manager");
    expect(markup).toContain("List the next three product decisions");
    expect(markup).toContain("0 messages");
    expect(markup).toContain('class="text-2xl font-semibold tracking-tight">Projects</h1>');
    expect(markup).not.toContain("Workspace view");
    expect(markup).not.toContain(
      "Scan projects as a quiet list, then open one focused page in the center workspace.",
    );
    expect(markup).not.toContain("text-3xl");
  });

  /**
   * Ensures the focused project page keeps task and thread sections in the center pane.
   */
  it("renders a focused project detail page", () => {
    const markup = renderToStaticMarkup(
      <ProjectDetailView {...buildProjectDetailViewProps()} />,
    );

    expect(markup).toContain("Back to projects");
    expect(markup).toContain("Project detail");
    expect(markup).toContain("Tasks in this project");
    expect(markup).toContain("Project thread");
    expect(markup).toContain("Show thread (0)");
    expect(markup).toContain('aria-label="Open task Define the smallest possible task manager"');
    expect(markup).toContain('aria-label="Project actions"');
    expect(markup).toContain('data-slot="dropdown-menu-trigger"');
    expect(markup).toContain('data-slot="separator"');
    expect(markup).toContain('class="mt-2 text-2xl font-semibold tracking-tight">Relay MVP</h1>');
    expect(markup).not.toContain("text-3xl");
  });

  /**
   * Confirms project tasks now expand the shared inline editor without replacing the list.
   */
  it("renders the shared inline editor when a project task is opened", () => {
    const markup = renderToStaticMarkup(
      <ProjectDetailView
        {...buildProjectDetailViewProps()}
        editingTaskId="task-1"
        editTitle="Define the smallest possible task manager"
        editDetails="Keep only create, edit, delete, and call-agent actions."
        editProject="project-1"
        editTags="planning"
      />,
    );

    expect(markup).toContain("Task title");
    expect(markup).toContain("Delete");
    expect(markup).toContain("Define the smallest possible task manager");
    expect(markup).toContain('aria-label="Open task List the next three product decisions"');
    expect(markup).not.toContain("Back to project tasks");
  });

  /**
   * Keeps the built-in No Project bucket lightweight by omitting the project thread UI.
   */
  it("does not render a project thread for the no-project bucket", () => {
    const markup = renderToStaticMarkup(
      <ProjectDetailView {...buildNoProjectDetailViewProps()} />,
    );

    expect(markup).toContain("No Project");
    expect(markup).not.toContain("Project thread");
    expect(markup).not.toContain("Show thread");
    expect(markup).not.toContain("saved messages");
  });
});
