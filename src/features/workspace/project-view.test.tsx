import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { ProjectView } from "./project-view";

function buildProjectViewProps() {
  return {
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    projects: workspaceSeed.projects,
    initiatives: workspaceSeed.initiatives,
    tasks: workspaceSeed.tasks,
    filterInitiativeId: null,
    pendingThreadId: null,
    readThreadDraft: vi.fn(() => ({
      message: "",
      error: null,
    })),
    onAddProject: vi.fn(),
    onUpdateProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onSelectProject: vi.fn(),
    onClearFilter: vi.fn(),
    onDeleteThreadMessage: vi.fn(),
    onThreadDraftChange: vi.fn(),
    onSendThreadMessage: vi.fn(),
    onAddTask: vi.fn(),
  };
}

describe("project view", () => {
  /**
   * Keeps the rebased project cards focused on child task titles and thread access.
   */
  it("renders child task titles and thread toggle", () => {
    const markup = renderToStaticMarkup(<ProjectView {...buildProjectViewProps()} />);

    expect(markup).toContain("Relay MVP");
    expect(markup).toContain("Define the smallest possible task manager");
    expect(markup).toContain("List the next three product decisions");
    expect(markup).toContain("Show thread (0)");
  });
});
