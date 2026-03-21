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
  return {
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    initiatives: workspaceSeed.initiatives,
    onAddTask: vi.fn(),
    onBack: vi.fn(),
    onDeleteProject: vi.fn(),
    onDeleteThreadMessage: vi.fn(),
    onOpenInitiative: vi.fn(),
    onSendThreadMessage: vi.fn(),
    onThreadDraftChange: vi.fn(),
    onUpdateProject: vi.fn(),
    pendingThreadId: null,
    project: workspaceSeed.projects.find((project) => project.id === "project-1") ?? null,
    readThreadDraft: vi.fn(() => ({
      message: "",
      error: null,
    })),
    tasks: workspaceSeed.tasks,
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
    expect(markup).toContain("Open initiative");
    expect(markup).toContain("Tasks in this project");
    expect(markup).toContain("Project thread");
    expect(markup).toContain("Show thread (0)");
    expect(markup).toContain('class="mt-2 text-2xl font-semibold tracking-tight">Relay MVP</h1>');
    expect(markup).not.toContain("text-3xl");
  });
});
