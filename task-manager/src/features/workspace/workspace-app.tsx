"use client";

import { useEffect, useState } from "react";

import { AgentConfigurationView } from "@/features/workspace/agent-configuration-view";
import {
  buildDeleteAgentContributionConfirmationMessage,
  buildDeleteTaskConfirmationMessage,
} from "@/features/workspace/delete-confirmation";
import {
  addTask,
  deleteAgentCall,
  deleteTask,
  recordAgentCall,
  updateTask,
} from "@/features/workspace/operations";
import {
  agentConfigStorageKey,
  createDefaultAgentConfig,
  getProviderLabel,
  normalizeAgentConfig,
} from "@/features/workspace/provider-config";
import { TaskManagementView } from "@/features/workspace/task-management-view";
import { readSelectedTask } from "@/features/workspace/task-overview";
import { WorkspaceTopMenu } from "@/features/workspace/workspace-top-menu";
import { createDefaultWorkspaceView } from "@/features/workspace/workspace-navigation";
import {
  type AgentConfigState,
  type AgentDraft,
  type ProviderId,
} from "@/features/workspace/types";
import {
  createDefaultWorkspaceSnapshot,
  normalizeWorkspaceSnapshot,
  workspaceStorageKey,
} from "@/features/workspace/workspace-storage";

/**
 * Hosts the app shell, view switching, and task/configuration state wiring.
 */
export function WorkspaceApp() {
  const [workspace, setWorkspace] = useState(createDefaultWorkspaceSnapshot);
  const [agentConfig, setAgentConfig] = useState<AgentConfigState>(createDefaultAgentConfig);
  const [hasLoadedWorkspace, setHasLoadedWorkspace] = useState(false);
  const [hasLoadedAgentConfig, setHasLoadedAgentConfig] = useState(false);
  const [activeView, setActiveView] = useState(createDefaultWorkspaceView);
  const [isTopMenuExpanded, setIsTopMenuExpanded] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [openAgentTaskId, setOpenAgentTaskId] = useState<string | null>(null);
  const [agentDrafts, setAgentDrafts] = useState<Record<string, AgentDraft>>({});
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const activeProvider: ProviderId = "openai";
  const activeProviderSettings = agentConfig.providers.openai;
  const activeProviderLabel = getProviderLabel(activeProvider);
  const isActiveProviderReady = Boolean(
    activeProviderSettings.apiKey.trim() && activeProviderSettings.model.trim(),
  );
  const selectedTask = readSelectedTask(workspace.tasks, selectedTaskId);
  const selectedAgentDraft = selectedTask
    ? readAgentDraft(agentDrafts, selectedTask.id)
    : createEmptyAgentDraft();

  /**
   * Hydrates saved workspace data after mount so task edits survive a browser refresh.
   */
  useEffect(() => {
    const savedWorkspace = window.localStorage.getItem(workspaceStorageKey);

    if (!savedWorkspace) {
      setHasLoadedWorkspace(true);
      return;
    }

    try {
      setWorkspace(normalizeWorkspaceSnapshot(JSON.parse(savedWorkspace)));
    } catch {
      setWorkspace(createDefaultWorkspaceSnapshot());
    }

    setHasLoadedWorkspace(true);
  }, []);

  /**
   * Persists tasks and agent history locally after the initial browser hydration is complete.
   */
  useEffect(() => {
    if (!hasLoadedWorkspace) {
      return;
    }

    window.localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
  }, [workspace, hasLoadedWorkspace]);

  /**
   * Hydrates saved provider settings after mount so browser-only storage stays optional.
   */
  useEffect(() => {
    const savedConfig = window.localStorage.getItem(agentConfigStorageKey);

    if (!savedConfig) {
      setHasLoadedAgentConfig(true);
      return;
    }

    try {
      setAgentConfig(normalizeAgentConfig(JSON.parse(savedConfig)));
    } catch {
      setAgentConfig(createDefaultAgentConfig());
    }

    setHasLoadedAgentConfig(true);
  }, []);

  /**
   * Persists provider settings locally after the initial browser hydration is complete.
   */
  useEffect(() => {
    if (!hasLoadedAgentConfig) {
      return;
    }

    window.localStorage.setItem(agentConfigStorageKey, JSON.stringify(agentConfig));
  }, [agentConfig, hasLoadedAgentConfig]);

  /**
   * Opens or closes the slim top menu without changing the active workspace view.
   */
  function handleToggleTopMenu() {
    setIsTopMenuExpanded((currentValue) => !currentValue);
  }

  /**
   * Switches between the task and configuration views, then tucks the menu away again.
   */
  function handleSelectView(nextView: ReturnType<typeof createDefaultWorkspaceView>) {
    setActiveView(nextView);
    setIsTopMenuExpanded(false);
  }

  /**
   * Creates a task when the title is present, then clears the draft fields for the next entry.
   */
  function handleAddTask() {
    if (!newTaskTitle.trim()) {
      return;
    }

    setWorkspace((currentWorkspace) =>
      addTask(currentWorkspace, {
        title: newTaskTitle,
        project: newTaskProject,
        details: newTaskDetails,
      }),
    );
    setNewTaskTitle("");
    setNewTaskProject("");
    setNewTaskDetails("");
  }

  /**
   * Opens a single task so the heavier controls can live in a dedicated drill-down view.
   */
  function handleOpenTask(taskId: string) {
    if (editingTaskId && editingTaskId !== taskId) {
      handleCancelEdit();
    }

    if (openAgentTaskId && openAgentTaskId !== taskId) {
      setOpenAgentTaskId(null);
    }

    setSelectedTaskId(taskId);
  }

  /**
   * Returns from the selected task to the compact overview list.
   */
  function handleReturnToOverview() {
    handleCancelEdit();
    setOpenAgentTaskId(null);
    setSelectedTaskId(null);
  }

  /**
   * Loads the selected task into local edit state so the row can switch into edit mode.
   */
  function handleStartEdit(taskId: string) {
    const task = workspace.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      return;
    }

    setSelectedTaskId(task.id);
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditProject(task.project);
    setEditDetails(task.details);
  }

  /**
   * Persists the current edit draft back into the task list and closes edit mode.
   */
  function handleSaveEdit(taskId: string) {
    if (!editTitle.trim()) {
      return;
    }

    setWorkspace((currentWorkspace) =>
      updateTask(currentWorkspace, {
        taskId,
        title: editTitle,
        project: editProject,
        details: editDetails,
      }),
    );
    setEditingTaskId(null);
    setEditTitle("");
    setEditProject("");
    setEditDetails("");
  }

  /**
   * Cancels row editing and clears the temporary draft values.
   */
  function handleCancelEdit() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditProject("");
    setEditDetails("");
  }

  /**
   * Deletes a task from the single list and closes related UI if that task was active.
   */
  function handleDeleteTask(taskId: string) {
    const task = workspace.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      return;
    }

    if (
      !window.confirm(
        buildDeleteTaskConfirmationMessage({
          taskTitle: task.title,
          agentCallCount: task.agentCalls.length,
        }),
      )
    ) {
      return;
    }

    setWorkspace((currentWorkspace) => deleteTask(currentWorkspace, taskId));

    if (editingTaskId === taskId) {
      handleCancelEdit();
    }

    if (openAgentTaskId === taskId) {
      setOpenAgentTaskId(null);
    }

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }

    if (pendingTaskId === taskId) {
      setPendingTaskId(null);
    }
  }

  /**
   * Deletes one saved agent contribution from a task while keeping the rest of the task intact.
   */
  function handleDeleteAgentContribution(taskId: string, agentCallId: string) {
    const task = workspace.tasks.find((candidate) => candidate.id === taskId);
    const agentCall = task?.agentCalls.find((candidate) => candidate.id === agentCallId);

    if (!task || !agentCall) {
      return;
    }

    if (
      !window.confirm(
        buildDeleteAgentContributionConfirmationMessage({
          taskTitle: task.title,
        }),
      )
    ) {
      return;
    }

    setWorkspace((currentWorkspace) =>
      deleteAgentCall(currentWorkspace, taskId, agentCallId),
    );
  }

  /**
   * Opens or closes the inline composer used to send one built-in agent request from a task.
   */
  function handleToggleAgentPanel(taskId: string) {
    setSelectedTaskId(taskId);
    setOpenAgentTaskId((currentTaskId) => (currentTaskId === taskId ? null : taskId));
    setAgentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: readAgentDraft(currentDrafts, taskId),
    }));
  }

  /**
   * Stores the latest brief text for a task's inline agent request and clears stale errors.
   */
  function handleAgentBriefChange(taskId: string, brief: string) {
    setAgentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: {
        brief,
        error: null,
      },
    }));
  }

  /**
   * Stores the latest API key for a provider in browser local storage.
   */
  function handleProviderApiKeyChange(providerId: ProviderId, apiKey: string) {
    setAgentConfig((currentConfig) => ({
      ...currentConfig,
      providers: {
        ...currentConfig.providers,
        [providerId]: {
          ...currentConfig.providers[providerId],
          apiKey,
        },
      },
    }));
  }

  /**
   * Stores the selected model name for a provider in browser local storage.
   */
  function handleProviderModelChange(providerId: ProviderId, model: string) {
    setAgentConfig((currentConfig) => ({
      ...currentConfig,
      providers: {
        ...currentConfig.providers,
        [providerId]: {
          ...currentConfig.providers[providerId],
          model,
        },
      },
    }));
  }

  /**
   * Makes a live provider request for the task and stores the outcome in task history.
   */
  async function handleCallAgent(taskId: string) {
    const task = workspace.tasks.find((candidate) => candidate.id === taskId);
    const draft = readAgentDraft(agentDrafts, taskId);
    const trimmedBrief = draft.brief.trim();

    if (!task) {
      return;
    }

    if (!trimmedBrief) {
      setAgentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [taskId]: {
          ...draft,
          error: "Describe what the agent should do for this task.",
        },
      }));
      return;
    }

    if (!activeProviderSettings.apiKey.trim()) {
      setAgentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [taskId]: {
          ...draft,
          error: `Add a ${activeProviderLabel} API key in Configuration before making a live call.`,
        },
      }));
      return;
    }

    if (!activeProviderSettings.model.trim()) {
      setAgentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [taskId]: {
          ...draft,
          error: `Add a ${activeProviderLabel} model in Configuration before making a live call.`,
        },
      }));
      return;
    }

    setPendingTaskId(taskId);
    setAgentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: {
        ...draft,
        error: null,
      },
    }));

    try {
      const response = await fetch("/api/agent-call", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          providerId: activeProvider,
          apiKey: activeProviderSettings.apiKey,
          model: activeProviderSettings.model,
          taskTitle: task.title,
          taskDetails: task.details,
          brief: trimmedBrief,
        }),
      });
      const payload = await readJsonSafely(response);
      const createdAt = formatCallTimestamp(new Date());

      if (!response.ok) {
        const errorMessage = readApiErrorMessage(payload);

        setWorkspace((currentWorkspace) =>
          recordAgentCall(currentWorkspace, {
            taskId,
            providerId: activeProvider,
            model: activeProviderSettings.model.trim(),
            brief: trimmedBrief,
            now: createdAt,
            status: "error",
            error: errorMessage,
          }),
        );
        setAgentDrafts((currentDrafts) => ({
          ...currentDrafts,
          [taskId]: {
            ...readAgentDraft(currentDrafts, taskId),
            error: errorMessage,
          },
        }));
        return;
      }

      setWorkspace((currentWorkspace) =>
        recordAgentCall(currentWorkspace, {
          taskId,
          providerId: activeProvider,
          model: readApiModel(payload, activeProviderSettings.model),
          brief: trimmedBrief,
          now: createdAt,
          status: "done",
          result: readApiResult(payload),
        }),
      );
      setAgentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [taskId]: createEmptyAgentDraft(),
      }));
      setOpenAgentTaskId(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "The live agent call failed unexpectedly.";
      const createdAt = formatCallTimestamp(new Date());

      setWorkspace((currentWorkspace) =>
        recordAgentCall(currentWorkspace, {
          taskId,
          providerId: activeProvider,
          model: activeProviderSettings.model.trim(),
          brief: trimmedBrief,
          now: createdAt,
          status: "error",
          error: errorMessage,
        }),
      );
      setAgentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [taskId]: {
          ...readAgentDraft(currentDrafts, taskId),
          error: errorMessage,
        },
      }));
    } finally {
      setPendingTaskId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] px-4 py-8 text-[color:var(--foreground)]">
      <div className="mx-auto max-w-5xl">
        <WorkspaceTopMenu
          activeView={activeView}
          isExpanded={isTopMenuExpanded}
          onSelectView={handleSelectView}
          onToggleMenu={handleToggleTopMenu}
        />

        <section className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          {activeView === "tasks" ? (
            <TaskManagementView
              activeProviderLabel={activeProviderLabel}
              activeProviderModel={activeProviderSettings.model}
              editDetails={editDetails}
              editProject={editProject}
              editingTaskId={editingTaskId}
              editTitle={editTitle}
              isActiveProviderReady={isActiveProviderReady}
              newTaskDetails={newTaskDetails}
              newTaskProject={newTaskProject}
              newTaskTitle={newTaskTitle}
              onAddTask={handleAddTask}
              onAgentBriefChange={handleAgentBriefChange}
              onCallAgent={handleCallAgent}
              onCancelEdit={handleCancelEdit}
              onCloseAgentPanel={() => setOpenAgentTaskId(null)}
              onDeleteAgentContribution={handleDeleteAgentContribution}
              onDeleteTask={handleDeleteTask}
              onOpenTask={handleOpenTask}
              onReturnToOverview={handleReturnToOverview}
              onSaveEdit={handleSaveEdit}
              onSetEditDetails={setEditDetails}
              onSetEditProject={setEditProject}
              onSetEditTitle={setEditTitle}
              onSetNewTaskDetails={setNewTaskDetails}
              onSetNewTaskProject={setNewTaskProject}
              onSetNewTaskTitle={setNewTaskTitle}
              onStartEdit={handleStartEdit}
              onToggleAgentPanel={handleToggleAgentPanel}
              openAgentTaskId={openAgentTaskId}
              pendingTaskId={pendingTaskId}
              selectedAgentDraft={selectedAgentDraft}
              selectedTask={selectedTask}
              tasks={workspace.tasks}
            />
          ) : (
            <AgentConfigurationView
              activeProvider={activeProvider}
              activeProviderLabel={activeProviderLabel}
              activeProviderSettings={activeProviderSettings}
              isActiveProviderReady={isActiveProviderReady}
              onProviderApiKeyChange={handleProviderApiKeyChange}
              onProviderModelChange={handleProviderModelChange}
            />
          )}
        </section>
      </div>
    </main>
  );
}

/**
 * Supplies the default task composer state when a task has not opened the agent yet.
 */
function createEmptyAgentDraft(): AgentDraft {
  return {
    brief: "",
    error: null,
  };
}

/**
 * Returns a stable task draft shape so the task UI does not branch on undefined state.
 */
function readAgentDraft(
  agentDrafts: Record<string, AgentDraft>,
  taskId: string,
): AgentDraft {
  return agentDrafts[taskId] ?? createEmptyAgentDraft();
}

/**
 * Formats timestamps for task-level agent activity in a short human-readable style.
 */
function formatCallTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Reads the provider result string from the route response with a clear fallback.
 */
function readApiResult(payload: unknown) {
  if (isRecord(payload) && typeof payload.result === "string" && payload.result.trim()) {
    return payload.result.trim();
  }

  return "The provider call completed without returning visible text.";
}

/**
 * Reads the model echoed back by the route so task history reflects the actual request.
 */
function readApiModel(payload: unknown, fallbackModel: string) {
  if (isRecord(payload) && typeof payload.model === "string" && payload.model.trim()) {
    return payload.model.trim();
  }

  return fallbackModel.trim();
}

/**
 * Reads a human-friendly error string from the route response body.
 */
function readApiErrorMessage(payload: unknown) {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return "The live agent call failed.";
}

/**
 * Handles route responses that may fail before sending back JSON.
 */
async function readJsonSafely(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Keeps small unknown-value parsing helpers readable in the client component.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
