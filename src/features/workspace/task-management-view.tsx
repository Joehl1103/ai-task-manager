"use client";

import { useState } from "react";

import { CheckCircle2, Circle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  filterVisibleProjects,
  inboxPickerLabel,
} from "@/features/workspace/projects";
import { cn } from "@/lib/utils";
import {
  collectTaskTags,
  groupTasksByProject,
  groupTasksByTag,
  TaskInlineEditor,
  type TaskGroup,
} from "@/features/workspace/tasks";
import { type Project, type Task } from "@/features/workspace/core";
import { type TaskGroupingMode } from "@/features/workspace/storage";

interface TaskManagementViewProps {
  tasks: Task[];
  projects: Project[];
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
  taskGroupingMode: TaskGroupingMode;
  onClearProjectFilter: () => void;
  onSetNewTaskTitle: (value: string) => void;
  onSetNewTaskDetails: (value: string) => void;
  onSetNewTaskProject: (value: string) => void;
  onSetNewTaskTags: (value: string) => void;
  onAddTask: () => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onSetEditTitle: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onToggleGroupingMode: () => void;
  onToggleTaskCompleted: (taskId: string) => void;
}

/**
 * Keeps the task workflow together while the app shell separates it from configuration.
 */
export function TaskManagementView({
  tasks,
  projects,
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
  taskGroupingMode,
  onClearProjectFilter,
  onSetNewTaskTitle,
  onSetNewTaskDetails,
  onSetNewTaskProject,
  onSetNewTaskTags,
  onAddTask,
  onOpenTask,
  onDeleteTask,
  onSaveEdit,
  onCancelEdit,
  onSetEditTitle,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onToggleGroupingMode,
  onToggleTaskCompleted,
}: TaskManagementViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const visibleProjects = filterVisibleProjects(projects);
  const allTags = collectTaskTags(tasks);
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
        ) : (
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            Click to open the full task composer.
          </p>
        )}
      </section>

      <section className="mt-6">
        <GroupedTaskOverview
          allTags={allTags}
          editDetails={editDetails}
          editingTaskId={editingTaskId}
          editProject={editProject}
          editTags={editTags}
          editTitle={editTitle}
          emptyStateMessage={emptyStateMessage}
          onCancelEdit={onCancelEdit}
          onDeleteTask={onDeleteTask}
          onOpenTask={onOpenTask}
          onSaveEdit={onSaveEdit}
          onSetEditDetails={onSetEditDetails}
          onSetEditProject={onSetEditProject}
          onSetEditTags={onSetEditTags}
          onSetEditTitle={onSetEditTitle}
          onToggleGroupingMode={onToggleGroupingMode}
          onToggleTaskCompleted={onToggleTaskCompleted}
          projects={visibleProjects}
          taskGroupingMode={taskGroupingMode}
          tasks={tasks}
        />
      </section>
    </>
  );
}

interface GroupedTaskOverviewProps {
  allTags: string[];
  editDetails: string;
  editingTaskId: string | null;
  editProject: string;
  editTags: string;
  editTitle: string;
  tasks: Task[];
  projects: Project[];
  emptyStateMessage: string;
  onCancelEdit: () => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  taskGroupingMode: TaskGroupingMode;
  onToggleGroupingMode: () => void;
  onToggleTaskCompleted: (taskId: string) => void;
}

/**
 * Renders tasks grouped by project or tag with lightweight section headings and a mode toggle.
 */
function GroupedTaskOverview({
  allTags,
  editDetails,
  editingTaskId,
  editProject,
  editTags,
  editTitle,
  tasks,
  projects,
  emptyStateMessage,
  onCancelEdit,
  onOpenTask,
  onDeleteTask,
  onSaveEdit,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onSetEditTitle,
  taskGroupingMode,
  onToggleGroupingMode,
  onToggleTaskCompleted,
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
          allTags={allTags}
          editDetails={editDetails}
          editingTaskId={editingTaskId}
          editProject={editProject}
          editTags={editTags}
          editTitle={editTitle}
          group={group}
          key={group.project || "__no_project__"}
          onCancelEdit={onCancelEdit}
          onDeleteTask={onDeleteTask}
          onOpenTask={onOpenTask}
          onSaveEdit={onSaveEdit}
          onSetEditDetails={onSetEditDetails}
          onSetEditProject={onSetEditProject}
          onSetEditTags={onSetEditTags}
          onSetEditTitle={onSetEditTitle}
          onToggleTaskCompleted={onToggleTaskCompleted}
          projects={projects}
        />
      ))}
    </div>
  );
}

interface ProjectSectionProps {
  allTags: string[];
  editDetails: string;
  editingTaskId: string | null;
  editProject: string;
  editTags: string;
  editTitle: string;
  group: TaskGroup;
  onCancelEdit: () => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  onToggleTaskCompleted: (taskId: string) => void;
  projects: Project[];
}

/**
 * Renders a single project section with its tasks as line items.
 */
function ProjectSection({
  allTags,
  editDetails,
  editingTaskId,
  editProject,
  editTags,
  editTitle,
  group,
  onCancelEdit,
  onOpenTask,
  onDeleteTask,
  onSaveEdit,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onSetEditTitle,
  onToggleTaskCompleted,
  projects,
}: ProjectSectionProps) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted-strong)]">
        {group.label}
        <span className="ml-2 text-[color:var(--muted)]">({group.tasks.length})</span>
      </h3>
      <ul className="mt-2">
        {group.tasks.map((task, index) => (
          <TaskOverviewRow
            allTags={allTags}
            editDetails={editDetails}
            editingTaskId={editingTaskId}
            editProject={editProject}
            editTags={editTags}
            editTitle={editTitle}
            key={task.id}
            onCancelEdit={onCancelEdit}
            onDeleteTask={onDeleteTask}
            onOpenTask={onOpenTask}
            onSaveEdit={onSaveEdit}
            onSetEditDetails={onSetEditDetails}
            onSetEditProject={onSetEditProject}
            onSetEditTags={onSetEditTags}
            onSetEditTitle={onSetEditTitle}
            onToggleTaskCompleted={onToggleTaskCompleted}
            projects={projects}
            showsSeparator={index < group.tasks.length - 1}
            task={task}
          />
        ))}
      </ul>
    </section>
  );
}

interface TaskOverviewRowProps {
  allTags: string[];
  editDetails: string;
  editingTaskId: string | null;
  editProject: string;
  editTags: string;
  editTitle: string;
  onCancelEdit: () => void;
  task: Task;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  onToggleTaskCompleted: (taskId: string) => void;
  projects: Project[];
  showsSeparator: boolean;
}

/**
 * Shows each task as a lightweight line item so scanning stays fast.
 * Fades out briefly when marked complete before the task moves to the archive.
 */
function TaskOverviewRow({
  allTags,
  editDetails,
  editingTaskId,
  editProject,
  editTags,
  editTitle,
  onCancelEdit,
  task,
  onOpenTask,
  onDeleteTask,
  onSaveEdit,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onSetEditTitle,
  onToggleTaskCompleted,
  projects,
  showsSeparator,
}: TaskOverviewRowProps) {
  const [isChecking, setIsChecking] = useState(false);

  function handleToggleCompleted() {
    setIsChecking(true);
    setTimeout(() => onToggleTaskCompleted(task.id), 800);
  }

  return (
    <li className="task-overview-line-item py-2">
      {task.id === editingTaskId ? (
        <TaskInlineEditor
          allTags={allTags}
          editDetails={editDetails}
          editProject={editProject}
          editTags={editTags}
          editTitle={editTitle}
          onCancel={onCancelEdit}
          onDelete={onDeleteTask}
          onSave={onSaveEdit}
          onSetEditDetails={onSetEditDetails}
          onSetEditProject={onSetEditProject}
          onSetEditTags={onSetEditTags}
          onSetEditTitle={onSetEditTitle}
          projects={projects}
          task={task}
        />
      ) : (
        <div className="pl-[13px]">
          <div className="flex min-h-8 items-center gap-2">
            <button
              aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              className="shrink-0 transition-colors hover:text-[color:var(--foreground)]"
              onClick={(event) => {
                event.stopPropagation();
                handleToggleCompleted();
              }}
              type="button"
            >
              {isChecking ? (
                <CheckCircle2 aria-hidden="true" className="size-4 fill-[color:var(--border)] text-[color:var(--border-strong)] transition-colors duration-300" />
              ) : task.completed ? (
                <CheckCircle2 aria-hidden="true" className="size-4 fill-[color:var(--border)] text-[color:var(--border-strong)]" />
              ) : (
                <Circle aria-hidden="true" className="size-4 text-[color:var(--border-strong)]" />
              )}
            </button>
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
        </div>
      )}

      {showsSeparator ? <Separator className="mt-2" /> : null}
    </li>
  );
}
