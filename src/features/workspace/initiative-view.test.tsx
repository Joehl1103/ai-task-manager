import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { InitiativeDetailView, InitiativeView } from "./initiative-view";
import { createAgentThread } from "@/features/workspace/threads";

function buildInitiativeViewProps(overrides?: {
  projects?: typeof workspaceSeed.projects;
}) {
  return {
    initiatives: workspaceSeed.initiatives,
    onAddInitiative: vi.fn(),
    onSelectInitiative: vi.fn(),
    projects: overrides?.projects ?? workspaceSeed.projects,
  };
}

function buildInitiativeDetailViewProps() {
  return {
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    initiative: workspaceSeed.initiatives[0],
    onAddProject: vi.fn(),
    onBack: vi.fn(),
    onDeleteInitiative: vi.fn(),
    onDeleteThreadMessage: vi.fn(),
    onSelectProject: vi.fn(),
    onSendThreadMessage: vi.fn(),
    onThreadDraftChange: vi.fn(),
    onUpdateInitiative: vi.fn(),
    pendingThreadId: null,
    projects: workspaceSeed.projects,
    readThreadDraft: vi.fn(() => ({
      message: "",
      error: null,
    })),
  } as const;
}

describe("initiative view", () => {
  /**
   * Shows linked project names inside the compact initiative overview cards.
   */
  it("renders a singular project count for one project", () => {
    const markup = renderToStaticMarkup(<InitiativeView {...buildInitiativeViewProps()} />);

    expect(markup).toContain("Q2 Product Launch");
    expect(markup).toContain("Relay MVP");
    expect(markup).not.toContain("Define the smallest possible task manager");
    expect(markup).toContain("1 project");
    expect(markup).not.toContain("1 projects");
    expect(markup).toContain('class="text-2xl font-semibold tracking-tight">Initiatives</h1>');
    expect(markup).not.toContain("Workspace view");
    expect(markup).not.toContain(
      "Open the strategic layer as a quiet list, then drill into one initiative at a time.",
    );
    expect(markup).not.toContain("text-3xl");
  });

  /**
   * Uses plural label when an initiative includes multiple projects.
   */
  it("renders plural project count for multiple projects", () => {
    const markup = renderToStaticMarkup(
      <InitiativeView
        {...buildInitiativeViewProps({
          projects: [
            ...workspaceSeed.projects,
            {
              id: "project-3",
              name: "Launch support docs",
              initiativeId: "initiative-1",
              deadline: "",
              agentThread: createAgentThread("project", "project-3"),
            },
          ],
        })}
      />,
    );

    expect(markup).toContain("2 projects");
    expect(markup).toContain("Launch support docs");
  });

  /**
   * Keeps the focused initiative page centered on projects and thread context.
   */
  it("renders the initiative detail page", () => {
    const markup = renderToStaticMarkup(
      <InitiativeDetailView {...buildInitiativeDetailViewProps()} />,
    );

    expect(markup).toContain("Back to initiatives");
    expect(markup).toContain("Initiative detail");
    expect(markup).toContain("Projects inside this initiative");
    expect(markup).toContain("Open project");
    expect(markup).toContain("Initiative thread");
    expect(markup).toContain("Show thread (2)");
    expect(markup).toContain('aria-label="Initiative actions"');
    expect(markup).toContain('data-slot="dropdown-menu-trigger"');
    expect(markup).toContain('data-slot="separator"');
    expect(markup).toContain('class="mt-2 text-2xl font-semibold tracking-tight">Q2 Product Launch</h1>');
    expect(markup).not.toContain("text-3xl");
  });
});
