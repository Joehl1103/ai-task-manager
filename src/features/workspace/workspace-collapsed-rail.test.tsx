import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceCollapsedRail } from "@/features/workspace/navigation";

describe("workspace collapsed rail", () => {
  /**
   * Keeps the sidebar re-open affordance pinned to the far-left edge as a thin strip.
   */
  it("renders a thin left rail with an expand control", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceCollapsedRail onExpand={vi.fn()} />,
    );

    expect(markup).toContain("workspace-collapsed-rail");
    expect(markup).toContain('data-slot="sidebar-rail"');
    expect(markup).toContain('aria-label="Collapsed workspace sidebar"');
    expect(markup).toContain('aria-label="Expand sidebar"');
    expect(markup).toContain("w-8");
    expect(markup).toContain('data-slot="tooltip-trigger"');
    expect(markup).not.toContain("Show sidebar");
  });
});
