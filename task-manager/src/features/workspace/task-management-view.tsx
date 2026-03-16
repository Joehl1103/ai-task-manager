"use client";

import { ArrowLeft, Bot, Pencil, Plus, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormattedAgentResponse } from "@/features/workspace/formatted-agent-response";
import { getProviderLabel } from "@/features/workspace/provider-config";
import { buildTaskOverviewSummary } from "@/features/workspace/task-overview";
import { type AgentCallStatus, type AgentDraft, type Task } from "@/features/workspace/types";

interface TaskManagementViewProps {
  tasks: Task[];
  selectedTask: Task | null;
  selectedAgentDraft: AgentDraft;
  newTaskTitle: string;
  newTaskDetails: string;
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  openAgentTaskId: string | null;
  pendingTaskId: string | null;
  activeProviderLabel: string;
  activeProviderModel: string;
  isActiveProviderReady: boolean;
  onSetNewTaskTitle: (value: string) => void;
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
  newTaskDetails,
  editingTaskId,
  editTitle,
  editDetails,
  openAgentTaskId,
  pendingTaskId,
  activeProviderLabel,
  activeProviderModel,
  isActiveProviderReady,
  onSetNewTaskTitle,
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
              One list for all tasks. Add, edit, delete, and send a task to one built-in
              agent while keeping configuration in its own separate view.
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
        <section className="mt-6 border-l-2 border-amber-300 bg-amber-50/80 px-4 py-3 text-amber-900">
          <p className="text-sm font-medium">Live agent calls need configuration first</p>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Task editing already works, but live agent calls will stay unavailable until
            you add an API key in the Configuration view from the top menu.
          </p>
        </section>
      ) : null}

      <section className="mt-6 border-b border-[color:var(--row-divider)] pb-6">
        <div className="grid max-w-2xl gap-3">
          <Input
            onChange={(event) => onSetNewTaskTitle(event.target.value)}
            placeholder="Task title"
            value={newTaskTitle}
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

      <section className="mt-6">
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
            {selectedTask ? "Focused task" : readTaskCountLabel(tasks.length)}
          </Badge>
        </div>

        {selectedTask ? (
          <TaskDrillDown
            activeProviderLabel={activeProviderLabel}
            activeProviderModel={activeProviderModel}
            agentDraft={selectedAgentDraft}
            editDetails={editDetails}
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
      <div className="task-overview-empty mt-6 py-8 text-center">
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          Add your first task above and it will appear as a simple line item.
        </p>
      </div>
    );
  }

  return (
    <ul className="task-overview-line-list mt-4 divide-y divide-[color:var(--row-divider)] border-y border-[color:var(--row-divider)]">
      {tasks.map((task) => (
        <TaskOverviewRow
          key={task.id}
          onDeleteTask={onDeleteTask}
          onOpenTask={onOpenTask}
          task={task}
        />
      ))}
    </ul>
  );
}

interface TaskOverviewRowProps {
  task: Task;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

/**
 * Shows each task as a lightweight line item so scanning stays fast.
 */
function TaskOverviewRow({ task, onOpenTask, onDeleteTask }: TaskOverviewRowProps) {
  const taskOverview = buildTaskOverviewSummary(task);
  const latestStatusText = taskOverview.latestAgentStatus
    ? readLatestAgentStatusLabel(taskOverview.latestAgentStatus)
    : null;

  return (
    <li className="task-overview-line-item py-3 transition-colors hover:bg-[color:var(--row-hover)] sm:py-4">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-medium sm:text-lg">{task.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
            {taskOverview.detailsPreview}
          </p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            {readAgentActivityLabel(taskOverview.agentCallCount)}
            {latestStatusText ? ` · ${latestStatusText}` : ""}
            {taskOverview.latestAgentTimestamp ? ` · ${taskOverview.latestAgentTimestamp}` : ""}
          </p>
        </div>

        <div className="flex min-h-11 shrink-0 items-center gap-1 sm:justify-end">
          <Button onClick={() => onOpenTask(task.id)} size="sm" variant="ghost">
            Open
          </Button>
          <Button onClick={() => onDeleteTask(task.id)} size="sm" variant="ghost">
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
      </div>
    </li>
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
  agentDraft: AgentDraft;
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
  agentDraft,
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
