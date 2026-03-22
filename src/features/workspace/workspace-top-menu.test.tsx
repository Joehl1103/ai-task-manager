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
        isOpen={false}
        onOpenChange={vi.fn()}
        onSelectMenu={vi.fn()}
      />,
    );

    expect(markup).toContain("workspace-top-menu-shell");
    expect(markup).toContain('data-slot="dropdown-menu-trigger"');
  });

  /**
   * Keeps the current destination label as the primary navigation control while moving the menu to
   * a stock shadcn dropdown pattern.
   */
  it("renders the active menu label as the trigger instead of a separate menu button", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceTopMenu
        activeMenu="projects"
        isOpen
        onOpenChange={vi.fn()}
        onSelectMenu={vi.fn()}
      />,
    );

    expect(markup).toContain('data-slot="dropdown-menu-content"');
    expect(markup).toContain("Navigate");
    expect(markup).toContain("Projects");
    expect(markup).toContain("Current");
    expect(markup).not.toContain(">Menu<");
  });
});
