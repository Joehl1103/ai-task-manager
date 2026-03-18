import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { ProjectView } from "./project-view";

function buildProjectViewProps() {
  return {
    projects: workspaceSeed.projects,
    initiatives: workspaceSeed.initiatives,
    tasks: workspaceSeed.tasks,
    filterInitiativeId: null,
    onAddProject: vi.fn(),
    onUpdateProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onSelectProject: vi.fn(),
    onClearFilter: vi.fn(),
    onAddTask: vi.fn(),
  };
}

describe("project view", () => {
  /**
   * Shows each child task with its deadline and tags in project cards.
   */
  it("renders child task deadline and tags", () => {
    const markup = renderToStaticMarkup(<ProjectView {...buildProjectViewProps()} />);

    expect(markup).toContain("Define the smallest possible task manager");
    expect(markup).toContain("Apr 5, 2026");
    expect(markup).toContain("planning");
  });
});
