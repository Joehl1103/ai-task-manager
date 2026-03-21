"use client";

import { useState } from "react";

import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  filterVisibleProjects,
  inboxPickerLabel,
  inboxProjectName,
  isHiddenInboxProjectId,
  isTaskInInbox,
  readProjectPickerValue,
} from "@/features/workspace/projects";
import { TaskDetailActionsMenu, TaskOverviewActionsMenu } from "@/features/workspace/tasks";
import { AgentThreadPanel, readThreadComposerPlaceholder } from "@/features/workspace/threads";
import { type Project, type Task, type ThreadDraft } from "@/features/workspace/core";

interface InboxViewProps {
  tasks: Task[];
  projects: Project[];
  selectedTask: Task | null;
  selectedThreadDraft: ThreadDraft;
  newTaskTitle: string;
  newTaskDetails: string;
  newTaskProject: string;
  newTaskTags: string;
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  editProject: string;
  editTags: string;
  pendingTaskId: string | null;
  activeProviderLabel: string;
  activeProviderModel: string;
  isActiveProviderReady: boolean;
  onSetNewTaskTitle: (value: string) => void;
  onSetNewTaskDetails: (value: string) => void;
  onSetNewTaskProject: (value: string) => void;
  onSetNewTaskTags: (value: string) => void;
  onAddTask: () => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReturnToOverview: () => void;
  onStartEdit: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDeleteThreadMessage: (taskId: string, messageId: string) => void;
  onSetEditTitle: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onThreadDraftChange: (taskId: string, message: string) => void;
  onSendThreadMessage: (taskId: string) => void;
}

/**
 * Renders the inbox view showing only tasks with no project assignment.
 */
export function InboxView({
  tasks,
  projects,
  selectedTask,
  selectedThreadDraft,
  newTaskTitle,
  newTaskDetails,
  newTaskProject,
  newTaskTags,
  editingTaskId,
  editTitle,
  editDetails,
  editProject,
  editTags,
  pendingTaskId,
  activeProviderLabel,
  activeProviderModel,
  isActiveProviderReady,
  onSetNewTaskTitle,
  onSetNewTaskDetails,
  onSetNewTaskProject,
  onSetNewTaskTags,
  onAddTask,
  onOpenTask,
  onDeleteTask,
  onReturnToOverview,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteThreadMessage,
  onSetEditTitle,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onThreadDraftChange,
  onSendThreadMessage,
}: InboxViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const visibleProjects = filterVisibleProjects(projects);
  const inboxTasks = tasks.filter((task) => isTaskInInbox(task));

  function handleExpandComposer() {
    onSetNewTaskProject("");
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
    onSetNewTaskTags("");
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Unassigned tasks ({inboxTasks.length})
        </p>
      </header>

      {!isActiveProviderReady ? (
        <p className="mt-2 text-sm text-amber-700">
          Live agent threads stay unavailable until configuration is added.
        </p>
      ) : null}

      <section className="mt-4">
        <button
          aria-expanded={isComposerExpanded}
          className="flex w-full items-center gap-2 text-left text-sm font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          onClick={handleExpandComposer}
          type="button"
        >
          <Plus className="size-4 shrink-0" />
          <span>Add task</span>
        </button>

        {isComposerExpanded ? (
          <div className="mt-3 grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
            <Input
              autoFocus
              onChange={(event) => onSetNewTaskTitle(event.target.value)}
              placeholder="Task title"
              value={newTaskTitle}
            />
            <Select
              onValueChange={(value) => onSetNewTaskProject(value === "_inbox" ? "" : value)}
              value={newTaskProject || "_inbox"}
            >
              <SelectTrigger>
                <SelectValue placeholder={inboxPickerLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_inbox">{inboxPickerLabel}</SelectItem>
                {visibleProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              onChange={(event) => onSetNewTaskTags(event.target.value)}
              placeholder="Tags (optional, comma-separated)"
              value={newTaskTags}
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
        ) : null}
      </section>

      <section className="mt-6">
        {selectedTask ? (
          <InboxTaskDrillDown
            activeProviderLabel={activeProviderLabel}
            activeProviderModel={activeProviderModel}
            threadDraft={selectedThreadDraft}
            editDetails={editDetails}
            editingTaskId={editingTaskId}
            editProject={editProject}
            editTags={editTags}
            editTitle={editTitle}
            onCancelEdit={onCancelEdit}
            onDeleteThreadMessage={onDeleteThreadMessage}
            onDeleteTask={onDeleteTask}
            onReturnToOverview={onReturnToOverview}
            onSaveEdit={onSaveEdit}
            onSetEditDetails={onSetEditDetails}
            onSetEditProject={onSetEditProject}
            onSetEditTags={onSetEditTags}
            onSetEditTitle={onSetEditTitle}
            onStartEdit={onStartEdit}
            onSendThreadMessage={onSendThreadMessage}
            onThreadDraftChange={onThreadDraftChange}
            pendingTaskId={pendingTaskId}
            projects={visibleProjects}
            task={selectedTask}
          />
        ) : inboxTasks.length === 0 ? (
          <p className="task-overview-empty mt-6 text-sm text-[color:var(--muted)]">
            No tasks in inbox
          </p>
        ) : (
          <InboxTaskList
            onDeleteTask={onDeleteTask}
            onOpenTask={onOpenTask}
            tasks={inboxTasks}
          />
        )}
      </section>
    </>
  );
}

interface InboxTaskListProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

/**
 * Renders inbox tasks as a flat list without grouping.
 */
function InboxTaskList({ tasks, onOpenTask, onDeleteTask }: InboxTaskListProps) {
  return (
    <div>
      <Separator className="mb-2" />
      <ul>
        {tasks.map((task, index) => (
          <InboxTaskRow
            key={task.id}
            onDeleteTask={onDeleteTask}
            onOpenTask={onOpenTask}
            showsSeparator={index < tasks.length - 1}
            task={task}
          />
        ))}
      </ul>
    </div>
  );
}

interface InboxTaskRowProps {
  task: Task;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  showsSeparator: boolean;
}

/**
 * Shows each inbox task as a lightweight line item.
 */
function InboxTaskRow({
  task,
  onOpenTask,
  onDeleteTask,
  showsSeparator,
}: InboxTaskRowProps) {
  return (
    <li className="task-overview-line-item py-2">
      <div className="flex min-h-8 items-center gap-2">
        <button
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left hover:text-[color:var(--muted-strong)]"
          onClick={() => onOpenTask(task.id)}
          type="button"
        >
          <span className="shrink truncate text-sm">{task.title}</span>
          {task.tags.length > 0 ? (
            <span className="flex min-w-0 items-center gap-1 overflow-hidden">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="max-w-24 truncate rounded-full bg-[#9ca3af] px-2 py-px text-xs font-medium leading-none text-white"
                >
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </button>
      </div>

      <div className="mt-2 flex justify-end">
        <TaskOverviewActionsMenu
          onDeleteTask={() => onDeleteTask(task.id)}
          onOpenTask={() => onOpenTask(task.id)}
        />
      </div>

      {showsSeparator ? <Separator className="mt-2" /> : null}
    </li>
  );
}

interface InboxTaskDrillDownProps {
  task: Task;
  projects: Project[];
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  editProject: string;
  editTags: string;
  pendingTaskId: string | null;
  activeProviderLabel: string;
  activeProviderModel: string;
  threadDraft: ThreadDraft;
  onReturnToOverview: () => void;
  onStartEdit: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDeleteThreadMessage: (taskId: string, messageId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSetEditTitle: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onThreadDraftChange: (taskId: string, message: string) => void;
  onSendThreadMessage: (taskId: string) => void;
}

/**
 * Renders the drill-down view for a selected inbox task.
 */
function InboxTaskDrillDown({
  task,
  projects,
  editingTaskId,
  editTitle,
  editDetails,
  editProject,
  editTags,
  pendingTaskId,
  activeProviderLabel,
  activeProviderModel,
  threadDraft,
  onReturnToOverview,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteThreadMessage,
  onDeleteTask,
  onSetEditTitle,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onThreadDraftChange,
  onSendThreadMessage,
}: InboxTaskDrillDownProps) {
  const isEditing = editingTaskId === task.id;
  const isCallingTask = pendingTaskId === task.id;
  const projectName = isHiddenInboxProjectId(task.projectId)
    ? inboxProjectName
    : projects.find((project) => project.id === task.projectId)?.name ?? null;

  return (
    <article className="mt-2 space-y-4">
      <Button onClick={onReturnToOverview} size="sm" variant="ghost">
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{task.title}</h2>
          {projectName ? (
            <p className="text-xs text-[color:var(--muted)]">{projectName}</p>
          ) : null}
          {task.tags.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#9ca3af] px-2.5 py-1 text-xs font-medium text-white">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <TaskDetailActionsMenu
          isEditing={isEditing}
          onDeleteTask={() => onDeleteTask(task.id)}
          onStartEdit={() => onStartEdit(task.id)}
        />
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Input
            className="border-x-0 border-t-0 bg-transparent px-0 focus:ring-0"
            onChange={(event) => onSetEditTitle(event.target.value)}
            placeholder="Task title"
            value={editTitle}
          />
          <Select
            onValueChange={(value) => onSetEditProject(value === "_inbox" ? "" : value)}
            value={readProjectPickerValue(editProject) || "_inbox"}
          >
            <SelectTrigger>
              <SelectValue placeholder={inboxPickerLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_inbox">{inboxPickerLabel}</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="border-x-0 border-t-0 bg-transparent px-0 focus:ring-0"
            onChange={(event) => onSetEditTags(event.target.value)}
            placeholder="Tags (optional, comma-separated)"
            value={editTags}
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

      <AgentThreadPanel
        activeProviderLabel={activeProviderLabel}
        activeProviderModel={activeProviderModel}
        composerPlaceholder={readThreadComposerPlaceholder({
          ownerType: "task",
          ownerId: task.id,
        })}
        draft={threadDraft}
        isPending={isCallingTask}
        onDeleteMessage={(messageId) => onDeleteThreadMessage(task.id, messageId)}
        onDraftChange={(message) => onThreadDraftChange(task.id, message)}
        onSend={() => onSendThreadMessage(task.id)}
        thread={task.agentThread}
      />
    </article>
  );
}
