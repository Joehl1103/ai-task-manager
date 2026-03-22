import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ArchiveView } from "./archive-view";
import { workspaceSeed } from "./mock-data";

afterEach(() => {
  vi.useRealTimers();
});

describe("archive view", () => {
  /**
   * Verifies the archive now uses card-based day groups and task details while keeping the
   * existing un-complete workflow intact.
   */
  it("renders completed tasks inside archive cards", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T12:00:00.000Z"));

    const completedTasks = [
      {
        ...workspaceSeed.tasks[0],
        completed: true,
        completedAt: "2026-03-21T10:30:00.000Z",
      },
    ];

    const markup = renderToStaticMarkup(
      <ArchiveView
        completedTasks={completedTasks}
        onToggleTaskCompleted={vi.fn()}
        projects={workspaceSeed.projects}
      />,
    );

    expect(markup).toContain("Archive");
    expect(markup).toContain("Today");
    expect(markup).toContain('data-slot="card"');
    expect(markup).toContain('data-slot="badge"');
    expect(markup).toContain("Define the smallest possible task manager");
    expect(markup).toContain('aria-label="Mark incomplete"');
    expect(markup).toContain("Project: Relay MVP");
    expect(markup).toContain("planning");
  });

  /**
   * Ensures the empty archive state also uses the shared card surface instead of a loose paragraph.
   */
  it("renders the empty archive state inside a card", () => {
    const markup = renderToStaticMarkup(
      <ArchiveView
        completedTasks={[]}
        onToggleTaskCompleted={vi.fn()}
        projects={workspaceSeed.projects}
      />,
    );

    expect(markup).toContain("No completed tasks yet.");
    expect(markup).toContain('data-slot="card"');
  });
});
