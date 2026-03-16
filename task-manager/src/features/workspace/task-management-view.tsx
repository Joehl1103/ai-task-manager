"use client";

import { useState } from "react";

import { ArrowLeft, Bot, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormattedAgentResponse } from "@/features/workspace/formatted-agent-response";
import { getProviderLabel } from "@/features/workspace/provider-config";
import { groupTasksByProject, type TaskGroup } from "@/features/workspace/task-grouping";
import { type AgentDraft, type Task } from "@/features/workspace/types";

interface TaskManagementViewProps {
  tasks: Task[];
  selectedTask: Task | null;
  selectedAgentDraft: AgentDraft;
  newTaskTitle: string;
  newTaskDetails: string;
  newTaskProject: string;
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  editProject: string;
  openAgentTaskId: string | null;
  pendingTaskId: string | null;
  activeProviderLabel: string;
  activeProviderModel: string;
  isActiveProviderReady: boolean;
  onSetNewTaskTitle: (value: string) => void;
  onSetNewTaskDetails: (value: string) => void;
  onSetNewTaskProject: (value: string) => void;
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
  onSetEditProject: (value: string) => void;
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
  newTaskProject,
  editingTaskId,
  editTitle,
  editDetails,
  editProject,
  openAgentTaskId,
  pendingTaskId,
  activeProviderLabel,
  activeProviderModel,
  isActiveProviderReady,
  onSetNewTaskTitle,
  onSetNewTaskDetails,
  onSetNewTaskProject,
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
  onSetEditProject,
  onCloseAgentPanel,
  onAgentBriefChange,
  onCallAgent,
}: TaskManagementViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);

  function handleExpandComposer() {
    setIsComposerExpanded(true);
  }

  function handleAddTaskAndCollapse() {
    if (!newTaskTitle.trim()) {
      return;
    }

    onAddTask();
    setIsComposerExpanded(false);
  }

  function handleCollapseComposer() {
    setIsComposerExpanded(false);
    onSetNewTaskTitle("");
    onSetNewTaskDetails("");
    onSetNewTaskProject("");
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </header>

      {!isActiveProviderReady ? (
        <p className="mt-2 text-sm text-amber-700">
          Live agent calls stay unavailable until configuration is added.
        </p>
      ) : null}

      <section className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
        <button
          className="flex w-full items-center gap-2 text-left text-sm text-[color:var(--muted-strong)]"
          onClick={handleExpandComposer}
          type="button"
        >
          <Plus className="size-4" />
          Add task
        </button>

        {isComposerExpanded ? (
          <div className="mt-3 grid gap-3">
            <Input
              autoFocus
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
            <div className="flex justify-end gap-2">
              <Button onClick={handleCollapseComposer} variant="ghost">
                Cancel
              </Button>
              <Button disabled={!newTaskTitle.trim()} onClick={handleAddTaskAndCollapse}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            Click to open the full task composer.
          </p>
        )}
      </section>

      <section className="mt-6">
        {selectedTask ? (
          <TaskDrillDown
            activeProviderLabel={activeProviderLabel}
            activeProviderModel={activeProviderModel}
            agentDraft={selectedAgentDraft}
            editDetails={editDetails}
            editingTaskId={editingTaskId}
            editProject={editProject}
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
          <GroupedTaskOverview onDeleteTask={onDeleteTask} onOpenTask={onOpenTask} tasks={tasks} />
        )}
      </section>
    </>
  );
}

interface GroupedTaskOverviewProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

/**
 * Renders tasks grouped by project with lightweight section headings.
 */
function GroupedTaskOverview({ tasks, onOpenTask, onDeleteTask }: GroupedTaskOverviewProps) {
  const groups = groupTasksByProject(tasks);

  if (groups.length === 0) {
    return <p className="task-overview-empty mt-6 text-sm text-[color:var(--muted)]">No tasks yet.</p>;
  }

  return (
    <div className="mt-2 space-y-6">
      {groups.map((group) => (
        <ProjectSection
          group={group}
          key={group.project || "__no_project__"}
          onDeleteTask={onDeleteTask}
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  );
}

interface ProjectSectionProps {
  group: TaskGroup;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

/**
 * Renders a single project section with its tasks as line items.
 */
function ProjectSection({ group, onOpenTask, onDeleteTask }: ProjectSectionProps) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted-strong)]">
        {group.label}
        <span className="ml-2 text-[color:var(--muted)]">({group.tasks.length})</span>
      </h3>
      <ul className="mt-1 border-t border-[color:var(--row-divider)]">
        {group.tasks.map((task) => (
          <TaskOverviewRow
            key={task.id}
            onDeleteTask={onDeleteTask}
            onOpenTask={onOpenTask}
            task={task}
          />
        ))}
      </ul>
    </section>
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
  return (
    <li className="task-overview-line-item flex min-h-11 items-center gap-2 border-b border-[color:var(--row-divider)] py-1">
      <button
        className="min-w-0 flex-1 truncate text-left text-sm hover:text-[color:var(--muted-strong)]"
        onClick={() => onOpenTask(task.id)}
        type="button"
      >
        {task.title}
      </button>

      <Button onClick={() => onOpenTask(task.id)} size="sm" variant="ghost">
        Open
      </Button>
      <Button onClick={() => onDeleteTask(task.id)} size="sm" variant="ghost">
        <Trash2 className="size-4" />
        Remove
      </Button>
    </li>
  );
}

interface TaskDrillDownProps {
  task: Task;
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  editProject: string;
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
  onSetEditProject: (value: string) => void;
  onCloseAgentPanel: () => void;
  onAgentBriefChange: (taskId: string, brief: string) => void;
  onCallAgent: (taskId: string) => void;
}

/**
 * Keeps drill-down controls functional while dropping boxed surfaces.
 */
function TaskDrillDown({
  task,
  editingTaskId,
  editTitle,
  editDetails,
  editProject,
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
  onSetEditProject,
  onCloseAgentPanel,
  onAgentBriefChange,
  onCallAgent,
}: TaskDrillDownProps) {
  const isEditing = editingTaskId === task.id;
  const isAgentPanelOpen = openAgentTaskId === task.id;
  const isCallingTask = pendingTaskId === task.id;

  return (
    <article className="mt-2 space-y-4">
      <Button onClick={onReturnToOverview} size="sm" variant="ghost">
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{task.title}</h2>
          {task.project ? (
            <p className="text-xs text-[color:var(--muted)]">{task.project}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1">
          <Button disabled={isEditing} onClick={() => onStartEdit(task.id)} size="sm" variant="ghost">
            <Pencil className="size-4" />
            {isEditing ? "Editing" : "Edit"}
          </Button>
          <Button
            onClick={() => onToggleAgentPanel(task.id)}
            size="sm"
            variant={isAgentPanelOpen ? "default" : "ghost"}
          >
            <Bot className="size-4" />
            {isAgentPanelOpen ? "Hide agent" : "Call agent"}
          </Button>
          <Button onClick={() => onDeleteTask(task.id)} size="sm" variant="ghost">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Input
            className="border-x-0 border-t-0 bg-transparent px-0 focus:ring-0"
            onChange={(event) => onSetEditTitle(event.target.value)}
            placeholder="Task title"
            value={editTitle}
          />
          <Input
            className="border-x-0 border-t-0 bg-transparent px-0 focus:ring-0"
            onChange={(event) => onSetEditProject(event.target.value)}
            placeholder="Project (optional)"
            value={editProject}
          />
          <Textarea
            className="rounded-none border-x-0 border-t-0 bg-transparent px-0 focus:ring-0"
            onChange={(event) => onSetEditDetails(event.target.value)}
            placeholder="Task details"
            value={editDetails}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={onCancelEdit} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button onClick={() => onSaveEdit(task.id)} size="sm">
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[color:var(--muted)]">{task.details || "No details yet."}</p>
      )}

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {readAgentActivityLabel(task.agentCalls.length)}
        </p>
        {task.agentCalls.length > 0 ? (
          <ul className="divide-y divide-[color:var(--row-divider)] border-y border-[color:var(--row-divider)]">
            {task.agentCalls.map((agentCall) => (
              <AgentContributionRow
                agentCall={agentCall}
                key={agentCall.id}
                onDelete={() => onDeleteAgentContribution(task.id, agentCall.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[color:var(--muted)]">No agent calls yet.</p>
        )}
      </section>

      {isAgentPanelOpen ? (
        <section className="space-y-3 border-t border-[color:var(--row-divider)] pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[color:var(--muted)]">
              Using {activeProviderLabel} · {activeProviderModel}
            </p>
            <button
              className="text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
              onClick={onCloseAgentPanel}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <Textarea
            onChange={(event) => onAgentBriefChange(task.id, event.target.value)}
            placeholder="What should the agent do for this task?"
            value={agentDraft.brief}
          />

          {agentDraft.error ? <p className="text-sm text-rose-700">{agentDraft.error}</p> : null}

          <div className="flex justify-end">
            <Button disabled={isCallingTask} onClick={() => onCallAgent(task.id)} size="sm">
              <Bot className="size-4" />
              {isCallingTask ? "Calling..." : "Send to agent"}
            </Button>
          </div>
        </section>
      ) : null}
    </article>
  );
}

interface AgentContributionRowProps {
  agentCall: Task["agentCalls"][number];
  onDelete: () => void;
}

/**
 * Keeps one saved agent contribution readable without card chrome.
 */
function AgentContributionRow({ agentCall, onDelete }: AgentContributionRowProps) {
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm">
            {getProviderLabel(agentCall.providerId)} · {agentCall.status}
          </p>
          <p className="text-xs text-[color:var(--muted)]">{agentCall.createdAt}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{agentCall.brief}</p>
          {agentCall.result ? <FormattedAgentResponse className="mt-2" content={agentCall.result} /> : null}
          {agentCall.error ? <p className="mt-1 text-sm text-rose-700">{agentCall.error}</p> : null}
        </div>

        <Button aria-label="Delete contribution" onClick={onDelete} size="sm" variant="ghost">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </li>
  );
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
