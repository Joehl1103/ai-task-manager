import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { workspaceSeed } from "./mock-data";
import { TaskManagementView } from "./task-management-view";

function buildTaskManagementViewProps() {
  return {
    tasks: workspaceSeed.tasks,
    projects: workspaceSeed.projects,
    selectedTask: null,
    selectedAgentDraft: {
      brief: "",
      error: null,
    },
    newTaskTitle: "",
    newTaskDetails: "",
    newTaskProject: "",
    newTaskTags: "",
    editingTaskId: null,
    editTitle: "",
    editDetails: "",
    editProject: "",
    editTags: "",
    openAgentTaskId: null,
    pendingTaskId: null,
    activeProviderLabel: "OpenAI",
    activeProviderModel: "gpt-5",
    isActiveProviderReady: true,
    taskGroupingMode: "project" as const,
    onSetNewTaskTitle: vi.fn(),
    onSetNewTaskDetails: vi.fn(),
    onSetNewTaskProject: vi.fn(),
    onSetNewTaskTags: vi.fn(),
    onAddTask: vi.fn(),
    onOpenTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onReturnToOverview: vi.fn(),
    onStartEdit: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onDeleteAgentContribution: vi.fn(),
    onToggleAgentPanel: vi.fn(),
    onSetEditTitle: vi.fn(),
    onSetEditDetails: vi.fn(),
    onSetEditProject: vi.fn(),
    onSetEditTags: vi.fn(),
    onCloseAgentPanel: vi.fn(),
    onAgentBriefChange: vi.fn(),
    onCallAgent: vi.fn(),
    onToggleGroupingMode: vi.fn(),
  };
}

describe("task management view", () => {
  /**
   * Renders tasks grouped by project with minimalist line items.
   */
  it("renders task rows as minimalist line items grouped by project", () => {
    const markup = renderToStaticMarkup(<TaskManagementView {...buildTaskManagementViewProps()} />);

    expect(markup).toContain("task-overview-line-item");
    expect(markup).toContain("Relay MVP");
    expect(markup).toContain("No project");
  });
});
