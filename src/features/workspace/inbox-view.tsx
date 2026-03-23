"use client";

import { useState } from "react";

import { CheckCircle2, Circle } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  filterVisibleProjects,
  isTaskInInbox,
} from "@/features/workspace/projects";
import {
  collectTaskTags,
  InboxTaskComposer,
  readDateBadges,
  TaskInlineEditor,
} from "@/features/workspace/tasks";
import { type Project, type Task } from "@/features/workspace/core";

interface InboxViewProps {
  tasks: Task[];
  projects: Project[];
  focusTitleInputSignal: number;
  isComposerExpanded: boolean;
  newTaskTitle: string;
  newTaskDetails: string;
  newTaskDueBy: string;
  newTaskProject: string;
  newTaskRemindOn: string;
  newTaskTags: string;
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  editDueBy: string;
  editProject: string;
  editRemindOn: string;
  editTags: string;
  onSetNewTaskTitle: (value: string) => void;
  onSetNewTaskDetails: (value: string) => void;
  onSetNewTaskDueBy: (value: string) => void;
  onSetNewTaskProject: (value: string) => void;
  onSetNewTaskRemindOn: (value: string) => void;
  onSetNewTaskTags: (value: string) => void;
  onAddTask: () => void;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onSetEditTitle: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditDueBy: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditRemindOn: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetComposerExpanded: (value: boolean) => void;
  onToggleTaskCompleted: (taskId: string) => void;
}

/**
 * Renders the inbox view showing only tasks with no project assignment.
 */
export function InboxView({
  tasks,
  projects,
  focusTitleInputSignal,
  isComposerExpanded,
  newTaskTitle,
  newTaskDetails,
  newTaskDueBy,
  newTaskProject,
  newTaskRemindOn,
  newTaskTags,
  editingTaskId,
  editTitle,
  editDetails,
  editDueBy,
  editProject,
  editRemindOn,
  editTags,
  onSetNewTaskTitle,
  onSetNewTaskDetails,
  onSetNewTaskDueBy,
  onSetNewTaskProject,
  onSetNewTaskRemindOn,
  onSetNewTaskTags,
  onAddTask,
  onOpenTask,
  onDeleteTask,
  onSaveEdit,
  onCancelEdit,
  onSetEditTitle,
  onSetEditDetails,
  onSetEditDueBy,
  onSetEditProject,
  onSetEditRemindOn,
  onSetEditTags,
  onSetComposerExpanded,
  onToggleTaskCompleted,
}: InboxViewProps) {
  const visibleProjects = filterVisibleProjects(projects);
  const inboxTasks = tasks.filter((task) => isTaskInInbox(task));
  const allTags = collectTaskTags(tasks);

  function handleExpandComposer() {
    onSetNewTaskProject("");
    onSetComposerExpanded(true);
  }

  function handleAddTaskAndCollapse() {
    if (!newTaskTitle.trim()) {
      return;
    }

    onAddTask();
    onSetComposerExpanded(false);
  }

  function handleCollapseComposer() {
    onSetComposerExpanded(false);
    onSetNewTaskTitle("");
    onSetNewTaskDetails("");
    onSetNewTaskDueBy("");
    onSetNewTaskProject("");
    onSetNewTaskRemindOn("");
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

      <section className="mt-4">
        <InboxTaskComposer
          allTags={allTags}
          focusTitleInputSignal={focusTitleInputSignal}
          isExpanded={isComposerExpanded}
          key={isComposerExpanded ? "expanded" : "collapsed"}
          newTaskDetails={newTaskDetails}
          newTaskDueBy={newTaskDueBy}
          newTaskProject={newTaskProject}
          newTaskRemindOn={newTaskRemindOn}
          newTaskTags={newTaskTags}
          newTaskTitle={newTaskTitle}
          onCollapse={handleCollapseComposer}
          onExpand={handleExpandComposer}
          onSetNewTaskDetails={onSetNewTaskDetails}
          onSetNewTaskDueBy={onSetNewTaskDueBy}
          onSetNewTaskProject={onSetNewTaskProject}
          onSetNewTaskRemindOn={onSetNewTaskRemindOn}
          onSetNewTaskTags={onSetNewTaskTags}
          onSetNewTaskTitle={onSetNewTaskTitle}
          onSubmit={handleAddTaskAndCollapse}
          projects={visibleProjects}
        />
      </section>

      <section className="mt-6">
        {inboxTasks.length === 0 ? (
          <p className="task-overview-empty mt-6 text-sm text-[color:var(--muted)]">
            No tasks in inbox
          </p>
        ) : (
          <InboxTaskList
            allTags={allTags}
            editDetails={editDetails}
            editDueBy={editDueBy}
            editingTaskId={editingTaskId}
            editProject={editProject}
            editRemindOn={editRemindOn}
            editTags={editTags}
            editTitle={editTitle}
            onCancelEdit={onCancelEdit}
            onDeleteTask={onDeleteTask}
            onOpenTask={onOpenTask}
            onSaveEdit={onSaveEdit}
            onSetEditDetails={onSetEditDetails}
            onSetEditDueBy={onSetEditDueBy}
            onSetEditProject={onSetEditProject}
            onSetEditRemindOn={onSetEditRemindOn}
            onSetEditTags={onSetEditTags}
            onSetEditTitle={onSetEditTitle}
            onToggleTaskCompleted={onToggleTaskCompleted}
            projects={visibleProjects}
            tasks={inboxTasks}
          />
        )}
      </section>
    </>
  );
}

interface InboxTaskListProps {
  allTags: string[];
  editDetails: string;
  editDueBy: string;
  editingTaskId: string | null;
  editProject: string;
  editRemindOn: string;
  editTags: string;
  editTitle: string;
  onCancelEdit: () => void;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditDueBy: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditRemindOn: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  onToggleTaskCompleted: (taskId: string) => void;
  projects: Project[];
}

/**
 * Renders inbox tasks as a flat list without grouping.
 */
function InboxTaskList({
  allTags,
  editDetails,
  editDueBy,
  editingTaskId,
  editProject,
  editRemindOn,
  editTags,
  editTitle,
  onCancelEdit,
  tasks,
  onDeleteTask,
  onOpenTask,
  onSaveEdit,
  onSetEditDetails,
  onSetEditDueBy,
  onSetEditProject,
  onSetEditRemindOn,
  onSetEditTags,
  onSetEditTitle,
  onToggleTaskCompleted,
  projects,
}: InboxTaskListProps) {
  return (
    <div>
      <Separator className="mb-2" />
      <ul>
        {tasks.map((task, index) => (
          <InboxTaskRow
            allTags={allTags}
            editDetails={editDetails}
            editDueBy={editDueBy}
            editingTaskId={editingTaskId}
            editProject={editProject}
            editRemindOn={editRemindOn}
            editTags={editTags}
            editTitle={editTitle}
            onCancelEdit={onCancelEdit}
            key={task.id}
            onDeleteTask={onDeleteTask}
            onOpenTask={onOpenTask}
            onSaveEdit={onSaveEdit}
            onSetEditDetails={onSetEditDetails}
            onSetEditDueBy={onSetEditDueBy}
            onSetEditProject={onSetEditProject}
            onSetEditRemindOn={onSetEditRemindOn}
            onSetEditTags={onSetEditTags}
            onSetEditTitle={onSetEditTitle}
            onToggleTaskCompleted={onToggleTaskCompleted}
            projects={projects}
            showsSeparator={index < tasks.length - 1}
            task={task}
          />
        ))}
      </ul>
    </div>
  );
}

interface InboxTaskRowProps {
  allTags: string[];
  editDetails: string;
  editDueBy: string;
  editingTaskId: string | null;
  editProject: string;
  editRemindOn: string;
  editTags: string;
  editTitle: string;
  onCancelEdit: () => void;
  task: Task;
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditDueBy: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditRemindOn: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  onToggleTaskCompleted: (taskId: string) => void;
  projects: Project[];
  showsSeparator: boolean;
}

/**
 * Shows each inbox task as a lightweight line item.
 * Fades out briefly when marked complete before the task moves to the archive.
 */
function InboxTaskRow({
  allTags,
  editDetails,
  editDueBy,
  editingTaskId,
  editProject,
  editRemindOn,
  editTags,
  editTitle,
  onCancelEdit,
  task,
  onOpenTask,
  onDeleteTask,
  onSaveEdit,
  onSetEditDetails,
  onSetEditDueBy,
  onSetEditProject,
  onSetEditRemindOn,
  onSetEditTags,
  onSetEditTitle,
  onToggleTaskCompleted,
  projects,
  showsSeparator,
}: InboxTaskRowProps) {
  const [isChecking, setIsChecking] = useState(false);

  function handleToggleCompleted() {
    setIsChecking(true);
    setTimeout(() => onToggleTaskCompleted(task.id), 800);
  }

  return (
    <li className="task-overview-line-item py-2">
      {(() => {
        const dateBadges = readDateBadges(task);

        return task.id === editingTaskId ? (
          <TaskInlineEditor
            allTags={allTags}
            editDetails={editDetails}
            editDueBy={editDueBy}
            editProject={editProject}
            editRemindOn={editRemindOn}
            editTags={editTags}
            editTitle={editTitle}
            onCancel={onCancelEdit}
            onDelete={onDeleteTask}
            onSave={onSaveEdit}
            onSetEditDetails={onSetEditDetails}
            onSetEditDueBy={onSetEditDueBy}
            onSetEditProject={onSetEditProject}
            onSetEditRemindOn={onSetEditRemindOn}
            onSetEditTags={onSetEditTags}
            onSetEditTitle={onSetEditTitle}
            projects={projects}
            task={task}
          />
        ) : (
          <div className="pl-[13px]">
            <div className="flex min-h-8 w-[700px] max-w-full items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-2">
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
              {dateBadges.length > 0 ? (
                <div className="flex shrink-0 items-center justify-end gap-3 text-right">
                  {dateBadges.map((dateBadge) => (
                    <span className={cn("text-xs", dateBadge.tone)} key={dateBadge.label}>
                      {dateBadge.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })()}

      {showsSeparator ? <Separator className="mt-2" /> : null}
    </li>
  );
}
