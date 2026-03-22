import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "@/features/workspace/mock-data";
import { filterVisibleProjects } from "@/features/workspace/projects";

import {
  InboxTaskComposer,
} from "./inbox-task-composer";
import { collectTaskTags, readTaskTagSuggestions } from "./task-tag-combobox";

function buildComposerProps() {
  return {
    allTags: collectTaskTags(workspaceSeed.tasks),
    focusTitleInputSignal: 0,
    isExpanded: false,
    newTaskDetails: "",
    newTaskProject: "",
    newTaskTags: "",
    newTaskTitle: "",
    onCollapse: vi.fn(),
    onExpand: vi.fn(),
    onSetNewTaskDetails: vi.fn(),
    onSetNewTaskProject: vi.fn(),
    onSetNewTaskTags: vi.fn(),
    onSetNewTaskTitle: vi.fn(),
    onSubmit: vi.fn(),
    projects: filterVisibleProjects(workspaceSeed.projects),
  };
}

describe("inbox task composer helpers", () => {
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

describe("inbox task composer", () => {
  /**
   * Keeps the collapsed affordance light so the inbox stays list-first until the user starts
   * drafting.
   */
  it("renders a quiet + Add task hint when collapsed", () => {
    const markup = renderToStaticMarkup(<InboxTaskComposer {...buildComposerProps()} />);

    expect(markup).toContain("+ Add task");
    expect(markup).not.toContain("Add details...");
    expect(markup).not.toContain("Tags (optional, comma-separated)");
  });

  /**
   * Confirms the expanded composer uses the shared labeled task form, popover-backed tag picker,
   * and explicit footer actions instead of the old ad hoc controls.
   */
  it("renders the redesigned expanded composer block", () => {
    const markup = renderToStaticMarkup(
      <InboxTaskComposer
        {...buildComposerProps()}
        isExpanded
        newTaskTags="planning, review"
      />,
    );

    expect(markup).toContain("Add details...");
    expect(markup).toContain("Task title");
    expect(markup).toContain("Add tag");
    expect(markup).toContain("⌘↵");
    expect(markup).toContain("Cancel");
    expect(markup).toContain("Add task");
    expect(markup).toContain('aria-label="Remove planning tag"');
    expect(markup).toContain('data-slot="select-trigger"');
    expect(markup).not.toContain("Tags (optional, comma-separated)");
  });
});
