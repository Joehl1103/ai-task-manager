import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceTopMenu } from "@/features/workspace/navigation";

describe("workspace top menu", () => {
  /**
   * Keeps the shell chrome intentionally light for the minimalist task workspace.
   */
  it("renders the lightweight top-menu shell class", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceTopMenu
        activeMenu="inbox"
        isExpanded={false}
        onSelectMenu={vi.fn()}
        onToggleMenu={vi.fn()}
      />,
    );

    expect(markup).toContain("workspace-top-menu-shell");
  });

  /**
   * Keeps the current destination label as the primary navigation control so switching views does
   * not require a reach to the far edge of the shell.
   */
  it("renders the active menu label as the trigger instead of a separate menu button", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceTopMenu
        activeMenu="projects"
        isExpanded={false}
        onSelectMenu={vi.fn()}
        onToggleMenu={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-controls="workspace-top-menu"');
    expect(markup).toContain("Projects");
    expect(markup).not.toContain(">Menu<");
  });

  /**
   * Keeps the tasks destination available in the top menu list.
   */
  it("renders tasks in the expanded top menu", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceTopMenu
        activeMenu="tasks"
        isExpanded
        onSelectMenu={vi.fn()}
        onToggleMenu={vi.fn()}
      />,
    );

    expect(markup).toContain("Tasks");
  });
});
