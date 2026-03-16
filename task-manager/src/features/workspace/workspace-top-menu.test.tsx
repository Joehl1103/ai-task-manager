import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceTopMenu } from "./workspace-top-menu";

describe("workspace top menu", () => {
  /**
   * Keeps the shell chrome intentionally light for the minimalist task workspace.
   */
  it("renders the lightweight top-menu shell class", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceTopMenu
        activeView="tasks"
        isExpanded={false}
        onSelectView={vi.fn()}
        onToggleMenu={vi.fn()}
      />,
    );

    expect(markup).toContain("workspace-top-menu-shell");
  });
});
