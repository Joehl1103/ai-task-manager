"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bot, Pencil, Plus, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  providerCatalog,
} from "@/features/workspace/provider-config";
import { buildTaskOverviewSummary, readSelectedTask } from "@/features/workspace/task-overview";
import {
  type AgentCallStatus,
  type AgentConfigState,
  type ProviderId,
  type Task,
} from "@/features/workspace/types";
import {
  createDefaultWorkspaceSnapshot,
  normalizeWorkspaceSnapshot,
  workspaceStorageKey,
} from "@/features/workspace/workspace-storage";
import { FormattedAgentResponse } from "@/features/workspace/formatted-agent-response";

interface AgentDraft {
  brief: string;
  error: string | null;
}

/**
 * Hosts the task overview list plus the drill-down workspace for a selected task.
 */
export function WorkspaceApp() {
  const [workspace, setWorkspace] = useState(createDefaultWorkspaceSnapshot);
  const [agentConfig, setAgentConfig] = useState<AgentConfigState>(createDefaultAgentConfig);
  const [hasLoadedWorkspace, setHasLoadedWorkspace] = useState(false);
  const [hasLoadedAgentConfig, setHasLoadedAgentConfig] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [openAgentTaskId, setOpenAgentTaskId] = useState<string | null>(null);
  const [agentDrafts, setAgentDrafts] = useState<Record<string, AgentDraft>>({});
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const activeProvider: ProviderId = "openai";
  const activeProviderSettings = agentConfig.providers.openai;
  const activeProviderLabel = getProviderLabel(activeProvider);
  const isActiveProviderReady = Boolean(activeProviderSettings.apiKey.trim());
  const selectedTask = readSelectedTask(workspace.tasks, selectedTaskId);

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
   * Creates a task when the title is present, then clears the draft fields for the next entry.
   */
  function handleAddTask() {
    if (!newTaskTitle.trim()) {
      return;
    }

    setWorkspace((currentWorkspace) =>
      addTask(currentWorkspace, {
        title: newTaskTitle,
        details: newTaskDetails,
      }),
    );
    setNewTaskTitle("");
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
        details: editDetails,
      }),
    );
    setEditingTaskId(null);
    setEditTitle("");
    setEditDetails("");
  }

  /**
   * Cancels row editing and clears the temporary draft values.
   */
  function handleCancelEdit() {
    setEditingTaskId(null);
    setEditTitle("");
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
          error: `Add a ${activeProviderLabel} API key in Agent settings before making a live call.`,
        },
      }));
      return;
    }

    if (!activeProviderSettings.model.trim()) {
      setAgentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [taskId]: {
          ...draft,
          error: `Add a ${activeProviderLabel} model in Agent settings before making a live call.`,
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
      <section className="mx-auto max-w-4xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <header className="border-b border-[color:var(--border)] pb-6">
          <p className="text-sm text-[color:var(--muted)]">Bare-bones starter</p>
          <h1 className="mt-2 text-3xl font-semibold">Tasks</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            One list for all tasks. Add, edit, delete, and send a task to one built-in
            agent with an OpenAI-backed first pass.
          </p>
        </header>

        <section className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium">Agent settings</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                OpenAI compatibility is wired first here. Add an OpenAI API key and
                adjust the model used for live task calls.
              </p>
            </div>
            <Badge variant={isActiveProviderReady ? "success" : "warning"}>
              {isActiveProviderReady ? "Live provider ready" : "API key needed"}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
            <label className="grid gap-2 text-sm">
              <span className="text-[color:var(--muted)]">
                {activeProviderLabel} API key
              </span>
              <Input
                onChange={(event) =>
                  handleProviderApiKeyChange(activeProvider, event.target.value)
                }
                placeholder={providerCatalog[activeProvider].apiKeyPlaceholder}
                type="password"
                value={activeProviderSettings.apiKey}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[color:var(--muted)]">{activeProviderLabel} model</span>
              <Input
                onChange={(event) =>
                  handleProviderModelChange(activeProvider, event.target.value)
                }
                placeholder={providerCatalog[activeProvider].defaultModel}
                value={activeProviderSettings.model}
              />
            </label>
          </div>

          <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
            Your OpenAI key stays in this browser&apos;s local storage and is only sent to
            the app when you trigger a live task agent call.
          </p>
        </section>

        <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <div className="grid gap-3">
            <Input
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Task title"
              value={newTaskTitle}
            />
            <Textarea
              onChange={(event) => setNewTaskDetails(event.target.value)}
              placeholder="Optional task details"
              value={newTaskDetails}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddTask}>
                <Plus className="size-4" />
                Add task
              </Button>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {selectedTask ? "Task drill-down" : "Task overview"}
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                {selectedTask
                  ? "Editing and agent activity live here so the main overview can stay compact."
                  : "Scan tasks in a lightweight overview, then open one when you want the full task context and agent history."}
              </p>
            </div>
            <Badge variant={selectedTask ? "accent" : "neutral"}>
              {selectedTask ? "Drill-down open" : readTaskCountLabel(workspace.tasks.length)}
            </Badge>
          </div>

          {selectedTask ? (
            <TaskDrillDown
              activeProviderLabel={activeProviderLabel}
              activeProviderModel={activeProviderSettings.model}
              agentDrafts={agentDrafts}
              editDetails={editDetails}
              editingTaskId={editingTaskId}
              editTitle={editTitle}
              onAgentBriefChange={handleAgentBriefChange}
              onCallAgent={handleCallAgent}
              onCancelEdit={handleCancelEdit}
              onCloseAgentPanel={() => setOpenAgentTaskId(null)}
              onDeleteAgentContribution={handleDeleteAgentContribution}
              onDeleteTask={handleDeleteTask}
              onReturnToOverview={handleReturnToOverview}
              onSaveEdit={handleSaveEdit}
              onSetEditDetails={setEditDetails}
              onSetEditTitle={setEditTitle}
              onStartEdit={handleStartEdit}
              onToggleAgentPanel={handleToggleAgentPanel}
              openAgentTaskId={openAgentTaskId}
              pendingTaskId={pendingTaskId}
              task={selectedTask}
            />
          ) : (
            <TaskOverviewList
              onDeleteTask={handleDeleteTask}
              onOpenTask={handleOpenTask}
              tasks={workspace.tasks}
            />
          )}
        </section>
      </section>
    </main>
  );
}

interface TaskOverviewListProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

/**
 * Renders the compact list of task summaries shown before a task is opened.
 */
function TaskOverviewList({ tasks, onOpenTask, onDeleteTask }: TaskOverviewListProps) {
  if (tasks.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-center">
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          Add your first task above and it will appear here as a compact overview card.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {tasks.map((task) => (
        <TaskOverviewCard
          key={task.id}
          onDeleteTask={onDeleteTask}
          onOpenTask={onOpenTask}
          task={task}
        />
      ))}
    </div>
  );
}

interface TaskOverviewCardProps {
  task: Task;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

/**
 * Shows the light task summary used in the main overview list.
 */
function TaskOverviewCard({ task, onOpenTask, onDeleteTask }: TaskOverviewCardProps) {
  const taskOverview = buildTaskOverviewSummary(task);

  return (
    <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-medium">{task.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {taskOverview.detailsPreview}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="neutral">{readAgentActivityLabel(taskOverview.agentCallCount)}</Badge>
            {taskOverview.latestAgentStatus ? (
              <Badge variant={readAgentStatusBadgeVariant(taskOverview.latestAgentStatus)}>
                {readLatestAgentStatusLabel(taskOverview.latestAgentStatus)}
              </Badge>
            ) : null}
          </div>

          {taskOverview.latestAgentTimestamp ? (
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Latest activity {taskOverview.latestAgentTimestamp}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button onClick={() => onOpenTask(task.id)}>Open task</Button>
          <Button onClick={() => onDeleteTask(task.id)} variant="outline">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

interface TaskDrillDownProps {
  task: Task;
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  openAgentTaskId: string | null;
  pendingTaskId: string | null;
  activeProviderLabel: string;
  activeProviderModel: string;
  agentDrafts: Record<string, AgentDraft>;
  onReturnToOverview: () => void;
  onStartEdit: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDeleteAgentContribution: (taskId: string, agentCallId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleAgentPanel: (taskId: string) => void;
  onSetEditTitle: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onCloseAgentPanel: () => void;
  onAgentBriefChange: (taskId: string, brief: string) => void;
  onCallAgent: (taskId: string) => void;
}

/**
 * Renders the focused task view where editing and agent history can expand freely.
 */
function TaskDrillDown({
  task,
  editingTaskId,
  editTitle,
  editDetails,
  openAgentTaskId,
  pendingTaskId,
  activeProviderLabel,
  activeProviderModel,
  agentDrafts,
  onReturnToOverview,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteAgentContribution,
  onDeleteTask,
  onToggleAgentPanel,
  onSetEditTitle,
  onSetEditDetails,
  onCloseAgentPanel,
  onAgentBriefChange,
  onCallAgent,
}: TaskDrillDownProps) {
  const taskOverview = buildTaskOverviewSummary(task);
  const isEditing = editingTaskId === task.id;
  const isAgentPanelOpen = openAgentTaskId === task.id;
  const agentDraft = readAgentDraft(agentDrafts, task.id);
  const isCallingTask = pendingTaskId === task.id;

  return (
    <article className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <Button onClick={onReturnToOverview} size="sm" variant="ghost">
        <ArrowLeft className="size-4" />
        Back to overview
      </Button>

      <div className="mt-4 flex flex-col gap-4 border-b border-[color:var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Task drill-down
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{task.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            {task.details || "No details yet."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="accent">{readAgentActivityLabel(taskOverview.agentCallCount)}</Badge>
            {taskOverview.latestAgentStatus ? (
              <Badge variant={readAgentStatusBadgeVariant(taskOverview.latestAgentStatus)}>
                {readLatestAgentStatusLabel(taskOverview.latestAgentStatus)}
              </Badge>
            ) : (
              <Badge variant="neutral">No agent activity yet</Badge>
            )}
          </div>

          {taskOverview.latestAgentTimestamp ? (
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Latest activity {taskOverview.latestAgentTimestamp}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button disabled={isEditing} onClick={() => onStartEdit(task.id)} variant="outline">
            <Pencil className="size-4" />
            {isEditing ? "Editing" : "Edit"}
          </Button>
          <Button
            onClick={() => onToggleAgentPanel(task.id)}
            variant={isAgentPanelOpen ? "default" : "outline"}
          >
            <Bot className="size-4" />
            {isAgentPanelOpen ? "Hide agent" : "Call agent"}
          </Button>
          <Button onClick={() => onDeleteTask(task.id)} variant="outline">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <div className="grid gap-3">
            <Input
              onChange={(event) => onSetEditTitle(event.target.value)}
              placeholder="Task title"
              value={editTitle}
            />
            <Textarea
              onChange={(event) => onSetEditDetails(event.target.value)}
              placeholder="Task details"
              value={editDetails}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button onClick={() => onSaveEdit(task.id)}>Save</Button>
              <Button onClick={onCancelEdit} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium">Agent activity</p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
              Detailed call history stays in the drill-down so the main overview can
              stay compact.
            </p>
          </div>
          <Badge variant={task.agentCalls.length > 0 ? "accent" : "neutral"}>
            {readAgentActivityLabel(task.agentCalls.length)}
          </Badge>
        </div>

        {task.agentCalls.length > 0 ? (
          <div className="mt-3 space-y-2">
            {task.agentCalls.map((agentCall) => (
              <AgentContributionCard
                key={agentCall.id}
                agentCall={agentCall}
                onDelete={() => onDeleteAgentContribution(task.id, agentCall.id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            No agent calls yet for this task.
          </p>
        )}
      </div>

      {isAgentPanelOpen ? (
        <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Call the built-in agent</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Using {activeProviderLabel} · {activeProviderModel}
              </p>
            </div>
            <button
              className="text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
              onClick={onCloseAgentPanel}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            <Textarea
              onChange={(event) => onAgentBriefChange(task.id, event.target.value)}
              placeholder="What should the agent do for this task?"
              value={agentDraft.brief}
            />

            {agentDraft.error ? (
              <p className="text-sm text-rose-700">{agentDraft.error}</p>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[color:var(--muted)]">
                This first pass is wired to OpenAI only, so update the OpenAI key or
                model above if you want different behavior.
              </p>
              <Button disabled={isCallingTask} onClick={() => onCallAgent(task.id)}>
                <Bot className="size-4" />
                {isCallingTask ? "Calling..." : "Send to agent"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

interface AgentContributionCardProps {
  agentCall: Task["agentCalls"][number];
  onDelete: () => void;
}

/**
 * Keeps one saved agent contribution self-contained so the drill-down stays readable.
 */
function AgentContributionCard({ agentCall, onDelete }: AgentContributionCardProps) {
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">Agent contribution · {agentCall.status}</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            {getProviderLabel(agentCall.providerId)} · {agentCall.model}
          </p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{agentCall.brief}</p>
          {agentCall.result ? (
            <FormattedAgentResponse className="mt-2" content={agentCall.result} />
          ) : null}
          {agentCall.error ? <p className="mt-1 text-sm text-rose-700">{agentCall.error}</p> : null}
          <p className="mt-1 text-xs text-[color:var(--muted)]">{agentCall.createdAt}</p>
        </div>

        <Button
          aria-label="Delete contribution"
          className="shrink-0 self-start whitespace-nowrap"
          onClick={onDelete}
          size="sm"
          variant="outline"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
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

/**
 * Reads a compact label for the number of tasks in the overview.
 */
function readTaskCountLabel(taskCount: number) {
  return taskCount === 1 ? "1 task" : `${taskCount} tasks`;
}

/**
 * Reads a compact label for task-level agent activity.
 */
function readAgentActivityLabel(agentCallCount: number) {
  if (agentCallCount === 0) {
    return "No agent calls";
  }

  return agentCallCount === 1 ? "1 agent call" : `${agentCallCount} agent calls`;
}

/**
 * Maps the latest agent status to the badge variant used in overview and drill-down views.
 */
function readAgentStatusBadgeVariant(status: AgentCallStatus) {
  return status === "done" ? "success" : "danger";
}

/**
 * Converts the latest agent status into a short human-readable label.
 */
function readLatestAgentStatusLabel(status: AgentCallStatus) {
  return status === "done" ? "Latest call done" : "Latest call error";
}
