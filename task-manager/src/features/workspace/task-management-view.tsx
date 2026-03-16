"use client";

import { ArrowLeft, Bot, Pencil, Plus, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormattedAgentResponse } from "@/features/workspace/formatted-agent-response";
import { getProviderLabel } from "@/features/workspace/provider-config";
import { buildTaskGroups, noProjectGroupLabel } from "@/features/workspace/task-grouping";
import { buildTaskOverviewSummary } from "@/features/workspace/task-overview";
import { type AgentCallStatus, type AgentDraft, type Task } from "@/features/workspace/types";

interface TaskManagementViewProps {
  tasks: Task[];
  selectedTask: Task | null;
  selectedAgentDraft: AgentDraft;
  newTaskTitle: string;
  newTaskProject: string;
  newTaskDetails: string;
  editingTaskId: string | null;
  editTitle: string;
  editProject: string;
  editDetails: string;
  openAgentTaskId: string | null;
  pendingTaskId: string | null;
  activeProviderLabel: string;
  activeProviderModel: string;
  isActiveProviderReady: boolean;
  onSetNewTaskTitle: (value: string) => void;
  onSetNewTaskProject: (value: string) => void;
  onSetNewTaskDetails: (value: string) => void;
  onAddTask: () => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReturnToOverview: () => void;
  onStartEdit: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDeleteAgentContribution: (taskId: string, agentCallId: string) => void;
  onToggleAgentPanel: (taskId: string) => void;
  onSetEditTitle: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onCloseAgentPanel: () => void;
  onAgentBriefChange: (taskId: string, brief: string) => void;
  onCallAgent: (taskId: string) => void;
}

/**
 * Keeps the task workflow together while the app shell separates it from configuration.
 */
export function TaskManagementView({
  tasks,
  selectedTask,
  selectedAgentDraft,
  newTaskTitle,
  newTaskProject,
  newTaskDetails,
  editingTaskId,
  editTitle,
  editProject,
  editDetails,
  openAgentTaskId,
  pendingTaskId,
  activeProviderLabel,
  activeProviderModel,
  isActiveProviderReady,
  onSetNewTaskTitle,
  onSetNewTaskProject,
  onSetNewTaskDetails,
  onAddTask,
  onOpenTask,
  onDeleteTask,
  onReturnToOverview,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteAgentContribution,
  onToggleAgentPanel,
  onSetEditTitle,
  onSetEditProject,
  onSetEditDetails,
  onCloseAgentPanel,
  onAgentBriefChange,
  onCallAgent,
}: TaskManagementViewProps) {
  return (
    <>
      <header className="border-b border-[color:var(--border)] pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-[color:var(--muted)]">Bare-bones starter</p>
            <h1 className="mt-2 text-3xl font-semibold">Tasks</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              Keep one lightweight workspace for all tasks, but scan them in project
              groups before opening a focused drill-down.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={selectedTask ? "accent" : "neutral"}>
              {selectedTask ? "Drill-down open" : readTaskCountLabel(tasks.length)}
            </Badge>
            <Badge variant={isActiveProviderReady ? "success" : "warning"}>
              {isActiveProviderReady ? "Configuration ready" : "Configuration needed"}
            </Badge>
          </div>
        </div>
      </header>

      {!isActiveProviderReady ? (
        <section className="mt-6 rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="text-sm font-medium">Live agent calls need configuration first</p>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Task editing already works, but live agent calls will stay unavailable until
            you add an API key in the Configuration view from the top menu.
          </p>
        </section>
      ) : null}

      <section className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
        <div className="grid gap-3">
          <Input
            onChange={(event) => onSetNewTaskTitle(event.target.value)}
            placeholder="Task title"
            value={newTaskTitle}
          />
          <Input
            onChange={(event) => onSetNewTaskProject(event.target.value)}
            placeholder="Project (optional)"
            value={newTaskProject}
          />
          <Textarea
            onChange={(event) => onSetNewTaskDetails(event.target.value)}
            placeholder="Optional task details"
            value={newTaskDetails}
          />
          <div className="flex justify-end">
            <Button onClick={onAddTask}>
              <Plus className="size-4" />
              Add task
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              {selectedTask ? "Task drill-down" : "Task overview"}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              {selectedTask
                ? "Editing and agent activity live here so the main overview can stay compact."
                : "Scan tasks in lightweight project sections, then open one when you want the full task context and agent history."}
            </p>
          </div>
          <Badge variant={selectedTask ? "accent" : "neutral"}>
            {selectedTask ? "Focused task" : readTaskCountLabel(tasks.length)}
          </Badge>
        </div>

        {selectedTask ? (
          <TaskDrillDown
            activeProviderLabel={activeProviderLabel}
            activeProviderModel={activeProviderModel}
            agentDraft={selectedAgentDraft}
            editDetails={editDetails}
            editProject={editProject}
            editingTaskId={editingTaskId}
            editTitle={editTitle}
            onAgentBriefChange={onAgentBriefChange}
            onCallAgent={onCallAgent}
            onCancelEdit={onCancelEdit}
            onCloseAgentPanel={onCloseAgentPanel}
            onDeleteAgentContribution={onDeleteAgentContribution}
            onDeleteTask={onDeleteTask}
            onReturnToOverview={onReturnToOverview}
            onSaveEdit={onSaveEdit}
            onSetEditDetails={onSetEditDetails}
            onSetEditProject={onSetEditProject}
            onSetEditTitle={onSetEditTitle}
            onStartEdit={onStartEdit}
            onToggleAgentPanel={onToggleAgentPanel}
            openAgentTaskId={openAgentTaskId}
            pendingTaskId={pendingTaskId}
            task={selectedTask}
          />
        ) : (
          <TaskOverviewList onDeleteTask={onDeleteTask} onOpenTask={onOpenTask} tasks={tasks} />
        )}
      </section>
    </>
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
          Add your first task above and it will appear in the matching project section.
        </p>
      </div>
    );
  }

  const taskGroups = buildTaskGroups(tasks);

  return (
    <div className="mt-4 space-y-4">
      {taskGroups.map((taskGroup) => (
        <section
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
          key={taskGroup.key}
        >
          <div className="flex flex-col gap-2 border-b border-[color:var(--border)] pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Project
              </p>
              <h2 className="mt-1 text-lg font-medium">{taskGroup.title}</h2>
            </div>
            <Badge variant={taskGroup.title === noProjectGroupLabel ? "neutral" : "accent"}>
              {readTaskCountLabel(taskGroup.taskCount)}
            </Badge>
          </div>

          <div className="mt-3 space-y-3">
            {taskGroup.tasks.map((task) => (
              <TaskOverviewCard
                key={task.id}
                onDeleteTask={onDeleteTask}
                onOpenTask={onOpenTask}
                task={task}
              />
            ))}
          </div>
        </section>
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
  const hasProject = Boolean(task.project.trim());

  return (
    <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-medium">{task.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {taskOverview.detailsPreview}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {hasProject ? <Badge variant="accent">{task.project.trim()}</Badge> : null}
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
  editProject: string;
  editDetails: string;
  openAgentTaskId: string | null;
  pendingTaskId: string | null;
  activeProviderLabel: string;
  activeProviderModel: string;
  agentDraft: AgentDraft;
  onReturnToOverview: () => void;
  onStartEdit: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDeleteAgentContribution: (taskId: string, agentCallId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleAgentPanel: (taskId: string) => void;
  onSetEditTitle: (value: string) => void;
  onSetEditProject: (value: string) => void;
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
  editProject,
  editDetails,
  openAgentTaskId,
  pendingTaskId,
  activeProviderLabel,
  activeProviderModel,
  agentDraft,
  onReturnToOverview,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteAgentContribution,
  onDeleteTask,
  onToggleAgentPanel,
  onSetEditTitle,
  onSetEditProject,
  onSetEditDetails,
  onCloseAgentPanel,
  onAgentBriefChange,
  onCallAgent,
}: TaskDrillDownProps) {
  const taskOverview = buildTaskOverviewSummary(task);
  const isEditing = editingTaskId === task.id;
  const isAgentPanelOpen = openAgentTaskId === task.id;
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
          {task.project.trim() ? (
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Project · {task.project.trim()}
            </p>
          ) : null}
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
            <Input
              onChange={(event) => onSetEditProject(event.target.value)}
              placeholder="Project (optional)"
              value={editProject}
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
              Detailed call history stays in the drill-down so the main overview can stay
              compact.
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
                agentCall={agentCall}
                key={agentCall.id}
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
                Use the Configuration view if you want to change the {activeProviderLabel}
                {" "}key or model before sending this task.
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
