import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { InitiativeView } from "./initiative-view";
import { type Initiative, type Project } from "./types";

function buildInitiativeViewProps(overrides?: {
  initiatives?: Initiative[];
  projects?: Project[];
}) {
  return {
    initiatives: overrides?.initiatives ?? workspaceSeed.initiatives,
    projects: overrides?.projects ?? workspaceSeed.projects,
    onAddInitiative: vi.fn(),
    onUpdateInitiative: vi.fn(),
    onDeleteInitiative: vi.fn(),
    onSelectInitiative: vi.fn(),
    onAddProject: vi.fn(),
  } as const;
}

describe("initiative view", () => {
  /**
   * Shows projects only in initiative cards, without nested task details.
   */
  it("renders a singular project count for one project", () => {
    const markup = renderToStaticMarkup(<InitiativeView {...buildInitiativeViewProps()} />);

    expect(markup).toContain("Relay MVP");
    expect(markup).not.toContain("Define the smallest possible task manager");
    expect(markup).toContain("1 project");
    expect(markup).not.toContain("1 projects");
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
            },
          ],
        })}
      />,
    );

    expect(markup).toContain("2 projects");
  });
});
