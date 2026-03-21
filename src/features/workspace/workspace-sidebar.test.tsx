import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { featureFlags } from "@/features/feature-flags";

import { workspaceSeed } from "./mock-data";
import { WorkspaceSidebar } from "@/features/workspace/navigation";

describe("workspace sidebar", () => {
  /**
   * Renders top-level destinations and expandable project and initiative children.
   */
  it("renders the sidebar shell with hierarchy", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceSidebar
        activeMenu="projects"
        initiatives={workspaceSeed.initiatives}
        isInitiativesExpanded
        isProjectsExpanded
        onSelectInitiative={vi.fn()}
        onSelectMenu={vi.fn()}
        onSelectProject={vi.fn()}
        onToggleInitiatives={vi.fn()}
        onToggleProjects={vi.fn()}
        onToggleSidebar={vi.fn()}
        projects={workspaceSeed.projects}
        selectedInitiativeId={null}
        selectedProjectId="project-1"
      />,
    );

    expect(markup).toContain("workspace-sidebar-shell");
    expect(markup).toContain("Inbox");
    expect(markup).toContain("Projects");
    expect(markup).toContain("Configuration");
    expect(markup).toContain("Relay MVP");
    if (featureFlags.initiatives) {
      expect(markup).toContain("Initiatives");
      expect(markup).toContain("Q2 Product Launch");
      expect(markup.indexOf("Configuration")).toBeGreaterThan(markup.indexOf("Initiatives"));
    } else {
      expect(markup).not.toContain("Initiatives");
      expect(markup).not.toContain("Q2 Product Launch");
    }
    expect(markup).not.toContain("size-1.5 shrink-0 rounded-full");
    expect(markup).not.toContain(">Relay<");
    expect(markup).not.toContain(">Workspace<");
    expect(markup).not.toContain("Quiet navigation, focused work.");
    expect(markup).toContain('class="truncate text-sm font-medium">Relay MVP</span>');
    expect(markup).toContain('data-slot="tooltip-trigger"');
    expect(markup).toContain('data-slot="separator"');
  });
});
