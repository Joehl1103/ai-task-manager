import { describe, expect, it } from "vitest";

import { workspaceSeed } from "./mock-data";
import { buildTaskGroups, noProjectGroupLabel } from "./task-grouping";

describe("task grouping", () => {
  /**
   * Keeps grouped overview sections stable while preserving the existing task order inside each group.
   */
  it("groups tasks by project without reordering tasks inside each section", () => {
    const groups = buildTaskGroups([
      {
        ...workspaceSeed.tasks[0]!,
        project: "Relay foundation",
      },
      {
        ...workspaceSeed.tasks[1]!,
        project: "Product direction",
      },
      {
        ...workspaceSeed.tasks[0]!,
        id: "task-3",
        title: "Split overview into sections",
        project: "Relay foundation",
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      title: "Relay foundation",
      taskCount: 2,
    });
    expect(groups[0]?.tasks.map((task) => task.id)).toEqual(["task-1", "task-3"]);
    expect(groups[1]).toMatchObject({
      title: "Product direction",
      taskCount: 1,
    });
  });

  /**
   * Makes blank or missing project values visible instead of dropping those tasks from the overview.
   */
  it("collects blank project values into a fallback group", () => {
    const groups = buildTaskGroups([
      {
        ...workspaceSeed.tasks[0]!,
        project: "   ",
      },
    ]);

    expect(groups).toEqual([
      {
        key: noProjectGroupLabel.toLowerCase(),
        title: noProjectGroupLabel,
        taskCount: 1,
        tasks: [
          {
            ...workspaceSeed.tasks[0]!,
            project: "   ",
          },
        ],
      },
    ]);
  });

  /**
   * Prevents casing differences from splitting what is effectively the same project into multiple sections.
   */
  it("groups project names case-insensitively while preserving the first visible label", () => {
    const groups = buildTaskGroups([
      {
        ...workspaceSeed.tasks[0]!,
        project: "Relay foundation",
      },
      {
        ...workspaceSeed.tasks[1]!,
        project: "relay foundation",
      },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: "relay foundation",
      title: "Relay foundation",
      taskCount: 2,
    });
  });
});
