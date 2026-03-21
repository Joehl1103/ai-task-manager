"use client";

import { useState } from "react";

import { ArrowLeft, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  filterVisibleProjects,
  inboxPickerLabel,
  inboxProjectName,
  isHiddenInboxProjectId,
  readProjectPickerValue,
} from "@/features/workspace/projects";
import { cn } from "@/lib/utils";
import {
  groupTasksByProject,
  groupTasksByTag,
  type TaskGroup,
} from "@/features/workspace/tasks";
import { type Project, type Task, type ThreadDraft } from "@/features/workspace/core";
import { type TaskGroupingMode } from "@/features/workspace/storage";
import { AgentThreadPanel, readThreadComposerPlaceholder } from "@/features/workspace/threads";

interface TaskManagementViewProps {
  tasks: Task[];
  projects: Project[];
  selectedTask: Task | null;
  selectedThreadDraft: ThreadDraft;
  activeProjectFilterName: string | null;
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
  taskGroupingMode: TaskGroupingMode;
  onClearProjectFilter: () => void;
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
  onToggleGroupingMode: () => void;
}

/**
 * Keeps the task workflow together while the app shell separates it from configuration.
 */
export function TaskManagementView({
  tasks,
  projects,
  selectedTask,
  selectedThreadDraft,
  activeProjectFilterName,
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
  taskGroupingMode,
  onClearProjectFilter,
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
  onToggleGroupingMode,
}: TaskManagementViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const visibleProjects = filterVisibleProjects(projects);
  const emptyStateMessage = activeProjectFilterName
    ? `No tasks in ${activeProjectFilterName} yet.`
    : "No tasks yet.";

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
    onSetNewTaskTags("");
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        {activeProjectFilterName ? (
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Filtered by: {activeProjectFilterName}
            <button
              className="ml-2 text-[color:var(--foreground)] underline transition-all duration-150 cursor-pointer active:opacity-70"
              onClick={onClearProjectFilter}
              type="button"
            >
              Clear
            </button>
          </p>
        ) : null}
      </header>

      {!isActiveProviderReady ? (
        <p className="mt-2 text-sm text-amber-700">
          Live agent threads stay unavailable until configuration is added.
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
            <select
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
              onChange={(e) => onSetNewTaskProject(e.target.value)}
              value={newTaskProject}
            >
              <option value="">{inboxPickerLabel}</option>
              {visibleProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
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
        ) : (
          <GroupedTaskOverview
            emptyStateMessage={emptyStateMessage}
            onDeleteTask={onDeleteTask}
            onOpenTask={onOpenTask}
            onToggleGroupingMode={onToggleGroupingMode}
            projects={visibleProjects}
            taskGroupingMode={taskGroupingMode}
            tasks={tasks}
          />
        )}
      </section>
    </>
  );
}

interface GroupedTaskOverviewProps {
  tasks: Task[];
  projects: Project[];
  emptyStateMessage: string;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  taskGroupingMode: TaskGroupingMode;
  onToggleGroupingMode: () => void;
}

/**
 * Renders tasks grouped by project or tag with lightweight section headings and a mode toggle.
 */
function GroupedTaskOverview({
  tasks,
  projects,
  emptyStateMessage,
  onOpenTask,
  onDeleteTask,
  taskGroupingMode,
  onToggleGroupingMode,
}: GroupedTaskOverviewProps) {
  const groups =
    taskGroupingMode === "tag" ? groupTasksByTag(tasks) : groupTasksByProject(tasks, projects);

  if (groups.length === 0) {
    return (
      <p className="task-overview-empty mt-6 text-sm text-[color:var(--muted)]">
        {emptyStateMessage}
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium uppercase tracking-wide text-[color:var(--muted-strong)]">
          Grouped by
        </span>
        <button
          className={cn(
            "transition-all duration-150 cursor-pointer active:opacity-70",
            taskGroupingMode === "project"
              ? "font-medium text-[color:var(--foreground)] underline underline-offset-2"
              : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
          )}
          onClick={onToggleGroupingMode}
          title="Group tasks by project"
          type="button"
        >
          Project
        </button>
        <span className="text-[color:var(--muted)]">·</span>
        <button
          className={cn(
            "transition-all duration-150 cursor-pointer active:opacity-70",
            taskGroupingMode === "tag"
              ? "font-medium text-[color:var(--foreground)] underline underline-offset-2"
              : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
          )}
          onClick={onToggleGroupingMode}
          title="Group tasks by tag"
          type="button"
        >
          Tag
        </button>
      </div>

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
    <li className="task-overview-line-item border-b border-[color:var(--row-divider)] py-2">
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

        <Button
          aria-label="Open task"
          className="h-8 w-8 text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          onClick={() => onOpenTask(task.id)}
          size="icon"
          title="Open task"
          variant="ghost"
        >
          <ArrowUpRight className="size-4" />
        </Button>
        <Button
          aria-label="Remove task"
          className="h-8 w-8 text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          onClick={() => onDeleteTask(task.id)}
          size="icon"
          title="Remove task"
          variant="ghost"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}

interface TaskDrillDownProps {
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
 * Keeps drill-down controls functional while dropping boxed surfaces.
 */
function TaskDrillDown({
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
}: TaskDrillDownProps) {
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
        <div className="flex flex-wrap gap-1">
          <Button disabled={isEditing} onClick={() => onStartEdit(task.id)} size="sm" variant="ghost">
            <Pencil className="size-4" />
            {isEditing ? "Editing" : "Edit"}
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
          <select
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            onChange={(e) => onSetEditProject(e.target.value)}
            value={readProjectPickerValue(editProject)}
          >
            <option value="">{inboxPickerLabel}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
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
