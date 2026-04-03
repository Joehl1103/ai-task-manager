import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "@/features/workspace/mock-data";
import { filterVisibleProjects } from "@/features/workspace/projects";

import { TaskComposer } from "./task-composer";
import { collectTaskTags, readTaskTagSuggestions } from "./task-tag-combobox";

describe("task composer helpers", () => {
  /**
   * Keeps autocomplete suggestions grounded in the full workspace tag vocabulary without surfacing
   * duplicate pills just because a tag was cased differently elsewhere.
   */
  it("collects unique workspace tags case-insensitively", () => {
    const tags = collectTaskTags([
      ...workspaceSeed.tasks,
      {
        ...workspaceSeed.tasks[0],
        id: "task-4",
        tags: ["Design", "deep work", " review "],
      },
    ]);

    expect(tags).toEqual(["planning", "design", "high-priority", "review", "deep work"]);
  });

  /**
   * Filters suggestions by substring while excluding tags the draft has already selected.
   */
  it("filters tag suggestions case-insensitively and removes already selected tags", () => {
    expect(
      readTaskTagSuggestions(
        ["planning", "design", "high-priority", "review"],
        "ig",
        ["planning"],
      ),
    ).toEqual(["design", "high-priority"]);

    expect(
      readTaskTagSuggestions(
        ["planning", "design", "high-priority", "review"],
        "",
        ["design", "review"],
      ),
    ).toEqual(["planning", "high-priority"]);
  });
});

describe("task composer", () => {
  /**
   * Keeps the collapsed affordance light so the view stays list-first until the user starts
   * drafting.
   */
  it("renders a quiet + Add task hint when collapsed", () => {
    const markup = renderToStaticMarkup(
      <TaskComposer
        allTags={collectTaskTags(workspaceSeed.tasks)}
        onSubmit={vi.fn()}
        projects={filterVisibleProjects(workspaceSeed.projects)}
      />,
    );

    expect(markup).toContain("+ Add task");
    expect(markup).not.toContain("Add details...");
    expect(markup).not.toContain("Tags (optional, comma-separated)");
  });
});
