"use client";

import { useMemo, useState } from "react";

import { CheckCircle2, ChevronDown, Circle } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { type Project, type Task, type TaskEditCallbacks, type TaskEditState } from "@/features/workspace/core";
import { filterVisibleProjects, inboxProjectId, inboxProjectName } from "@/features/workspace/projects";
import {
  type DateRangeFilter,
  dateRangeFilters,
  collectTaskTags,
  createDefaultTaskFilters,
  filterTasks,
  groupTasksByProject,
  groupTasksByTag,
  normalizeTaskFilters,
  readDateBadges,
  TaskComposer,
  type TaskComposerSubmitData,
  TaskInlineEditor,
  type TaskFilters,
  type TaskGroup,
} from "@/features/workspace/tasks";
import {
  defaultTaskGroupingMode,
  normalizeTaskGroupingMode,
  taskGroupingModeStorageKey,
  tasksFilterStorageKey,
  type TaskGroupingMode,
} from "@/features/workspace/storage";
import { cn } from "@/lib/utils";

interface TasksViewProps extends TaskEditState, TaskEditCallbacks {
  tasks: Task[];
  projects: Project[];
  /** Opens the thread side panel for a given task — wired in Task 3. */
  onOpenThreadPanel?: (taskId: string) => void;
}

/**
 * Renders all active tasks with lightweight filter controls and grouping.
 */
export function TasksView({
  tasks,
  projects,
  editingTaskId,
  editTitle,
  editDetails,
  editDueBy,
  editProject,
  editRemindOn,
  editTags,
  onAddTask,
  onOpenTask,
  onOpenThreadPanel,
  onDeleteTask,
  onSaveEdit,
  onCancelEdit,
  onSetEditTitle,
  onSetEditDetails,
  onSetEditDueBy,
  onSetEditProject,
  onSetEditRemindOn,
  onSetEditTags,
  onToggleTaskCompleted,
}: TasksViewProps) {
  const visibleProjects = filterVisibleProjects(projects);
  const [groupingMode, setGroupingMode] = useState<TaskGroupingMode>(() => {
    if (typeof window === "undefined") {
      return defaultTaskGroupingMode;
    }

    return normalizeTaskGroupingMode(window.localStorage.getItem(taskGroupingModeStorageKey));
  });
  const [filters, setFilters] = useState<TaskFilters>(() => {
    if (typeof window === "undefined") {
      return createDefaultTaskFilters();
    }

    const saved = window.localStorage.getItem(tasksFilterStorageKey);

    if (!saved) {
      return createDefaultTaskFilters();
    }

    try {
      return normalizeTaskFilters(JSON.parse(saved));
    } catch {
      return createDefaultTaskFilters();
    }
  });
  const allTags = useMemo(() => collectTaskTags(tasks), [tasks]);
  const filteredTasks = useMemo(() => filterTasks(tasks, filters, new Date()), [tasks, filters]);
  const groups = useMemo(
    () => (groupingMode === "tag" ? groupTasksByTag(filteredTasks) : groupTasksByProject(filteredTasks, visibleProjects)),
    [filteredTasks, groupingMode, visibleProjects],
  );

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </header>

      <section className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[color:var(--muted)]">
        <ProjectFilterMenu
          projects={visibleProjects}
          selectedProjectId={filters.projectId}
          onSelect={(projectId) => {
            const nextFilters = { ...filters, projectId };

            setFilters(nextFilters);
            persistTaskFilters(nextFilters);
          }}
        />
        <TagFilterMenu
          tags={allTags}
          selectedTag={filters.tag}
          onSelect={(tag) => {
            const nextFilters = { ...filters, tag };

            setFilters(nextFilters);
            persistTaskFilters(nextFilters);
          }}
        />
        <DateFilterMenu
          label="Due by:"
          selected={filters.dueBy}
          onSelect={(dueBy) => {
            const nextFilters = { ...filters, dueBy };

            setFilters(nextFilters);
            persistTaskFilters(nextFilters);
          }}
        />
        <DateFilterMenu
          label="Remind on:"
          selected={filters.remindOn}
          onSelect={(remindOn) => {
            const nextFilters = { ...filters, remindOn };

            setFilters(nextFilters);
            persistTaskFilters(nextFilters);
          }}
        />
      </section>

      <section className="mt-4 flex items-center gap-2 text-xs">
        <span className="font-medium uppercase tracking-wide text-[color:var(--muted-strong)]">Grouped by</span>
        <button
          className={cn(
            "transition-all duration-150 cursor-pointer active:opacity-70",
            groupingMode === "project"
              ? "font-medium text-[color:var(--foreground)] underline underline-offset-2"
              : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
          )}
          onClick={() => setGroupingModeAndPersist("project", setGroupingMode)}
          type="button"
        >
          Project
        </button>
        <span className="text-[color:var(--muted)]">·</span>
        <button
          className={cn(
            "transition-all duration-150 cursor-pointer active:opacity-70",
            groupingMode === "tag"
              ? "font-medium text-[color:var(--foreground)] underline underline-offset-2"
              : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
          )}
          onClick={() => setGroupingModeAndPersist("tag", setGroupingMode)}
          type="button"
        >
          Tag
        </button>
      </section>

      <section className="mt-4">
        <TaskComposer
          allTags={allTags}
          onSubmit={onAddTask}
          projects={visibleProjects}
          submitLabel="Save"
        />
      </section>

      <section className="mt-5">
        {groups.length === 0 ? (
          <div className="mt-6 flex items-center gap-2">
            <p className="task-overview-empty text-sm text-[color:var(--muted)]">
              {hasActiveFilters(filters) ? "No tasks match the current filters." : "No tasks yet."}
            </p>
            {hasActiveFilters(filters) ? (
              <button
                className="text-[11px] text-[color:var(--muted)] underline transition-colors hover:text-[color:var(--foreground)]"
                onClick={() => {
                  const nextFilters = createDefaultTaskFilters();

                  setFilters(nextFilters);
                  persistTaskFilters(nextFilters);
                }}
                type="button"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          groups.map((group) => (
            <TaskGroupSection
              editDetails={editDetails}
              editDueBy={editDueBy}
              editingTaskId={editingTaskId}
              editProject={editProject}
              editRemindOn={editRemindOn}
              editTags={editTags}
              editTitle={editTitle}
              group={group}
              key={group.project || "__no_group__"}
              onCancelEdit={onCancelEdit}
              onDeleteTask={onDeleteTask}
              onOpenTask={onOpenTask}
              onOpenThreadPanel={onOpenThreadPanel}
              onSaveEdit={onSaveEdit}
              onSetEditDetails={onSetEditDetails}
              onSetEditDueBy={onSetEditDueBy}
              onSetEditProject={onSetEditProject}
              onSetEditRemindOn={onSetEditRemindOn}
              onSetEditTags={onSetEditTags}
              onSetEditTitle={onSetEditTitle}
              onToggleTaskCompleted={onToggleTaskCompleted}
              projects={visibleProjects}
            />
          ))
        )}
      </section>
    </>
  );
}

function readProjectFilterLabel(projectId: string | null, projects: Project[]): string {
  if (!projectId) {
    return "All";
  }

  if (projectId === inboxProjectId) {
    return inboxProjectName;
  }

  return projects.find((project) => project.id === projectId)?.name ?? projectId;
}

function readDateFilterLabel(value: DateRangeFilter): string {
  switch (value) {
    case "any":
      return "Any";
    case "overdue":
      return "Overdue";
    case "today":
      return "Today";
    case "this-week":
      return "This week";
    case "this-month":
      return "This month";
  }
}

function persistTaskFilters(filters: TaskFilters) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(tasksFilterStorageKey, JSON.stringify(filters));
}

function hasActiveFilters(filters: TaskFilters): boolean {
  return Boolean(filters.projectId) || Boolean(filters.tag) || filters.dueBy !== "any" || filters.remindOn !== "any";
}

interface ProjectFilterMenuProps {
  selectedProjectId: string | null;
  projects: Project[];
  onSelect: (projectId: string | null) => void;
}

function ProjectFilterMenu({ selectedProjectId, projects, onSelect }: ProjectFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          type="button"
        >
          <span>Project:</span>
          <span className="text-[color:var(--muted-strong)]">{readProjectFilterLabel(selectedProjectId, projects)}</span>
          <ChevronDown aria-hidden="true" className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="text-xs">
        <DropdownMenuItem onSelect={() => onSelect(null)}>All</DropdownMenuItem>
        {projects.map((project) => (
          <DropdownMenuItem key={project.id} onSelect={() => onSelect(project.id)}>
            {project.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TagFilterMenuProps {
  tags: string[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

function TagFilterMenu({ tags, selectedTag, onSelect }: TagFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          type="button"
        >
          <span>Tag:</span>
          <span className="text-[color:var(--muted-strong)]">{selectedTag ?? "All"}</span>
          <ChevronDown aria-hidden="true" className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="text-xs">
        <DropdownMenuItem onSelect={() => onSelect(null)}>All</DropdownMenuItem>
        {tags.map((tag) => (
          <DropdownMenuItem key={tag} onSelect={() => onSelect(tag)}>
            {tag}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DateFilterMenuProps {
  label: string;
  selected: DateRangeFilter;
  onSelect: (value: DateRangeFilter) => void;
}

function DateFilterMenu({ label, selected, onSelect }: DateFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          type="button"
        >
          <span>{label}</span>
          <span className="text-[color:var(--muted-strong)]">{readDateFilterLabel(selected)}</span>
          <ChevronDown aria-hidden="true" className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="text-xs">
        {dateRangeFilters.map((value) => (
          <DropdownMenuItem key={value} onSelect={() => onSelect(value)}>
            {readDateFilterLabel(value)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TaskGroupSectionProps {
  group: TaskGroup;
  editingTaskId: string | null;
  editTitle: string;
  editDetails: string;
  editDueBy: string;
  editProject: string;
  editRemindOn: string;
  editTags: string;
  projects: Project[];
  onOpenTask: (taskId: string) => void;
  onOpenThreadPanel?: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onSetEditTitle: (value: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditDueBy: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditRemindOn: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onToggleTaskCompleted: (taskId: string) => void;
}

function TaskGroupSection({
  group,
  editingTaskId,
  editTitle,
  editDetails,
  editDueBy,
  editProject,
  editRemindOn,
  editTags,
  projects,
  onOpenTask,
  onOpenThreadPanel,
  onDeleteTask,
  onSaveEdit,
  onCancelEdit,
  onSetEditTitle,
  onSetEditDetails,
  onSetEditDueBy,
  onSetEditProject,
  onSetEditRemindOn,
  onSetEditTags,
  onToggleTaskCompleted,
}: TaskGroupSectionProps) {
  return (
    <section className="mt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted-strong)]">
        {group.label}
        <span className="ml-2 text-[color:var(--muted)]">({group.tasks.length})</span>
      </h3>
      <ul className="mt-2">
        {group.tasks.map((task, index) => (
          <li className="task-overview-line-item py-2" key={task.id}>
            {(() => {
              const dateBadges = readDateBadges(task);

              return task.id === editingTaskId ? (
                <TaskInlineEditor
                  allTags={[]}
                  editDetails={editDetails}
                  editDueBy={editDueBy}
                  editProject={editProject}
                  editRemindOn={editRemindOn}
                  editTags={editTags}
                  editTitle={editTitle}
                  onCancel={onCancelEdit}
                  onDelete={onDeleteTask}
                  onOpenThread={onOpenThreadPanel ? () => onOpenThreadPanel(task.id) : undefined}
                  onSave={onSaveEdit}
                  onSetEditDetails={onSetEditDetails}
                  onSetEditDueBy={onSetEditDueBy}
                  onSetEditProject={onSetEditProject}
                  onSetEditRemindOn={onSetEditRemindOn}
                  onSetEditTags={onSetEditTags}
                  onSetEditTitle={onSetEditTitle}
                  projects={projects}
                  task={task}
                  threadMessageCount={task.agentThread.messages.length}
                />
              ) : (
                <div className="pl-[13px]">
                  <div className="flex min-h-8 w-[700px] max-w-full items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <button
                        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                        className="shrink-0 transition-colors hover:text-[color:var(--foreground)]"
                        onClick={() => onToggleTaskCompleted(task.id)}
                        type="button"
                      >
                        {task.completed ? (
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
                                className="max-w-24 truncate rounded-full bg-[#9ca3af] px-2 py-px text-xs font-medium leading-none text-white"
                                key={tag}
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
            {index < group.tasks.length - 1 ? <Separator className="mt-2" /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function setGroupingModeAndPersist(
  nextMode: TaskGroupingMode,
  setGroupingMode: (mode: TaskGroupingMode) => void,
) {
  setGroupingMode(nextMode);

  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(taskGroupingModeStorageKey, nextMode);
}
