"use client";

import { Separator } from "@/components/ui/separator";
import {
  filterVisibleProjects,
  isTaskInInbox,
} from "@/features/workspace/projects";
import {
  collectTaskTags,
  InboxTaskComposer,
  TaskDrillDown,
  TaskOverviewActionsMenu,
} from "@/features/workspace/tasks";
import { type Project, type Task, type ThreadDraft } from "@/features/workspace/core";

interface InboxViewProps {
  tasks: Task[];
  projects: Project[];
  focusTitleInputSignal: number;
  isComposerExpanded: boolean;
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
  onSetComposerExpanded: (value: boolean) => void;
  onThreadDraftChange: (taskId: string, message: string) => void;
  onSendThreadMessage: (taskId: string) => void;
}

/**
 * Renders the inbox view showing only tasks with no project assignment.
 */
export function InboxView({
  tasks,
  projects,
  focusTitleInputSignal,
  isComposerExpanded,
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
  onSetComposerExpanded,
  onThreadDraftChange,
  onSendThreadMessage,
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

      {!selectedTask ? (
        <section className="mt-4">
          <InboxTaskComposer
            allTags={allTags}
            focusTitleInputSignal={focusTitleInputSignal}
            isExpanded={isComposerExpanded}
            key={isComposerExpanded ? "expanded" : "collapsed"}
            newTaskDetails={newTaskDetails}
            newTaskProject={newTaskProject}
            newTaskTags={newTaskTags}
            newTaskTitle={newTaskTitle}
            onCollapse={handleCollapseComposer}
            onExpand={handleExpandComposer}
            onSetNewTaskDetails={onSetNewTaskDetails}
            onSetNewTaskProject={onSetNewTaskProject}
            onSetNewTaskTags={onSetNewTaskTags}
            onSetNewTaskTitle={onSetNewTaskTitle}
            onSubmit={handleAddTaskAndCollapse}
            projects={visibleProjects}
          />
        </section>
      ) : null}

      <section className="mt-6">
        {selectedTask ? (
          <TaskDrillDown
            activeProviderLabel={activeProviderLabel}
            activeProviderModel={activeProviderModel}
            allTags={allTags}
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
