"use client";

import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";

import { featureFlags } from "@/features/feature-flags";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  filterVisibleProjects,
  isPermanentProjectId,
  supportsProjectThread,
} from "@/features/workspace/projects";
import {
  type Initiative,
  type Project,
  type Task,
  type ThreadDraft,
} from "@/features/workspace/core";
import {
  AgentThreadPanel,
  readThreadComposerPlaceholder,
} from "@/features/workspace/threads";

interface ProjectViewProps {
  initiatives: Initiative[];
  onAddProject: (data: { name: string; initiativeId: string; deadline: string }) => void;
  onSelectProject: (projectId: string) => void;
  projects: Project[];
  tasks: Task[];
}

/**
 * Renders the projects overview as a quiet list of rows rather than a grid of cards.
 */
export function ProjectView({
  initiatives,
  onAddProject,
  onSelectProject,
  projects,
  tasks,
}: ProjectViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newName, setNewName] = useState("");
  const [newInitiativeId, setNewInitiativeId] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const visibleProjects = filterVisibleProjects(projects);

  function handleAdd() {
    if (!newName.trim()) {
      return;
    }

    onAddProject({
      name: newName,
      initiativeId: newInitiativeId,
      deadline: newDeadline,
    });
    setNewName("");
    setNewInitiativeId("");
    setNewDeadline("");
    setIsComposerExpanded(false);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        </div>
        <Button
          aria-expanded={isComposerExpanded}
          onClick={() => setIsComposerExpanded((currentValue) => !currentValue)}
          variant={isComposerExpanded ? "subtle" : "ghost"}
        >
          <Plus className="size-4" />
          Add project
        </Button>
      </header>

      {isComposerExpanded ? (
        <section className="grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <Input
            autoFocus
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Project name"
            value={newName}
          />
          {featureFlags.initiatives ? (
            <Select
              onValueChange={(value) => setNewInitiativeId(value === "_none" ? "" : value)}
              value={newInitiativeId || "_none"}
            >
              <SelectTrigger>
                <SelectValue placeholder="No initiative" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No initiative</SelectItem>
                {initiatives.map((initiative) => (
                  <SelectItem key={initiative.id} value={initiative.id}>
                    {initiative.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            onChange={(event) => setNewDeadline(event.target.value)}
            placeholder="Deadline"
            type="date"
            value={newDeadline}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsComposerExpanded(false);
                setNewName("");
                setNewInitiativeId("");
                setNewDeadline("");
              }}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={!newName.trim()} onClick={handleAdd}>
              Save project
            </Button>
          </div>
        </section>
      ) : null}

      {visibleProjects.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">
          No projects yet. Add one to create a new destination in the sidebar.
        </p>
      ) : (
        <section>
          {visibleProjects.map((project, index) => {
            const projectInitiative = project.initiativeId
              ? initiatives.find((initiative) => initiative.id === project.initiativeId) ?? null
              : null;
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            const canUseProjectThread = supportsProjectThread(project.id);

            return (
              <div key={project.id}>
                {index > 0 ? <Separator /> : null}
                <button
                  className="group block w-full py-4 text-left transition-colors hover:bg-[color:var(--row-hover)]"
                  onClick={() => onSelectProject(project.id)}
                  type="button"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-medium text-[color:var(--foreground)]">
                          {project.name}
                        </p>
                        {featureFlags.initiatives ? (
                          <p className="text-xs text-[color:var(--muted)]">
                            {projectInitiative ? projectInitiative.name : "No initiative"}
                          </p>
                        ) : null}
                        <p className="text-xs text-[color:var(--muted)]">
                          {readTaskCountLabel(projectTasks.length)}
                        </p>
                        <p className="text-xs text-[color:var(--muted)]">
                          {project.deadline
                            ? `Due ${formatDeadline(project.deadline)}`
                            : "No deadline"}
                        </p>
                        {canUseProjectThread ? (
                          <p className="text-xs text-[color:var(--muted)]">
                            {project.agentThread.messages.length} messages
                          </p>
                        ) : null}
                      </div>

                      {projectTasks.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[color:var(--muted)]">
                          {projectTasks.slice(0, 2).map((task) => (
                            <span key={task.id}>{task.title}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-[color:var(--muted)]">
                          No tasks linked yet.
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
                      Open
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

interface ProjectDetailViewProps {
  activeProviderLabel: string;
  activeProviderModel: string;
  initiatives: Initiative[];
  onAddTask: (data: { title: string; details: string; projectId: string; tags: string[] }) => void;
  onBack: () => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteThreadMessage: (projectId: string, messageId: string) => void;
  onOpenInitiative: (initiativeId: string) => void;
  onSendThreadMessage: (projectId: string) => void;
  onThreadDraftChange: (projectId: string, message: string) => void;
  onUpdateProject: (data: { id: string; name: string; initiativeId: string; deadline: string }) => void;
  pendingThreadId: string | null;
  project: Project | null;
  readThreadDraft: (projectId: string) => ThreadDraft;
  tasks: Task[];
}

/**
 * Renders one selected project as a focused center-page detail view with minimal framing.
 */
export function ProjectDetailView({
  activeProviderLabel,
  activeProviderModel,
  initiatives,
  onAddTask,
  onBack,
  onDeleteProject,
  onDeleteThreadMessage,
  onOpenInitiative,
  onSendThreadMessage,
  onThreadDraftChange,
  onUpdateProject,
  pendingThreadId,
  project,
  readThreadDraft,
  tasks,
}: ProjectDetailViewProps) {
  if (!project) {
    return (
      <section className="py-12">
        <p className="text-lg font-medium">Project not found</p>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          The selected project is no longer available.
        </p>
      </section>
    );
  }

  return (
    <ProjectDetailContent
      activeProviderLabel={activeProviderLabel}
      activeProviderModel={activeProviderModel}
      initiatives={initiatives}
      key={readProjectDetailKey(project)}
      onAddTask={onAddTask}
      onBack={onBack}
      onDeleteProject={onDeleteProject}
      onDeleteThreadMessage={onDeleteThreadMessage}
      onOpenInitiative={onOpenInitiative}
      onSendThreadMessage={onSendThreadMessage}
      onThreadDraftChange={onThreadDraftChange}
      onUpdateProject={onUpdateProject}
      pendingThreadId={pendingThreadId}
      project={project}
      readThreadDraft={readThreadDraft}
      tasks={tasks}
    />
  );
}

interface ProjectDetailContentProps
  extends Omit<ProjectDetailViewProps, "project"> {
  project: Project;
}

function ProjectDetailContent({
  activeProviderLabel,
  activeProviderModel,
  initiatives,
  onAddTask,
  onBack,
  onDeleteProject,
  onDeleteThreadMessage,
  onOpenInitiative,
  onSendThreadMessage,
  onThreadDraftChange,
  onUpdateProject,
  pendingThreadId,
  project,
  readThreadDraft,
  tasks,
}: ProjectDetailContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editInitiativeId, setEditInitiativeId] = useState(project.initiativeId || "");
  const [editDeadline, setEditDeadline] = useState(project.deadline);
  const [isTaskComposerOpen, setIsTaskComposerOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  const activeProject = project;
  const linkedInitiative = activeProject.initiativeId
    ? initiatives.find((initiative) => initiative.id === activeProject.initiativeId) ?? null
    : null;
  const childTasks = tasks.filter((task) => task.projectId === activeProject.id);
  const canUseProjectThread = supportsProjectThread(activeProject.id);

  function handleSaveProject() {
    if (!editName.trim()) {
      return;
    }

    onUpdateProject({
      id: activeProject.id,
      name: editName,
      initiativeId: editInitiativeId,
      deadline: editDeadline,
    });
    setIsEditing(false);
  }

  function handleAddTask() {
    if (!newTaskTitle.trim()) {
      return;
    }

    const tags = newTaskTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onAddTask({
      title: newTaskTitle,
      details: newTaskDetails,
      projectId: activeProject.id,
      tags,
    });
    setNewTaskTitle("");
    setNewTaskDetails("");
    setNewTaskTags("");
    setIsTaskComposerOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <Button onClick={onBack} variant="ghost">
            <ArrowLeft className="size-4" />
            Back to projects
          </Button>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Project detail
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{activeProject.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[color:var(--muted)]">
            <span>{readTaskCountLabel(childTasks.length)}</span>
            <span>
              {activeProject.deadline
                ? `Due ${formatDeadline(activeProject.deadline)}`
                : "No deadline"}
            </span>
            {featureFlags.initiatives ? (
              <span>
                {linkedInitiative ? `Initiative: ${linkedInitiative.name}` : "No initiative"}
              </span>
            ) : null}
            {canUseProjectThread ? (
              <span>{activeProject.agentThread.messages.length} saved messages</span>
            ) : null}
          </div>
          {featureFlags.initiatives && linkedInitiative ? (
            <div className="mt-4">
              <Button onClick={() => onOpenInitiative(linkedInitiative.id)} variant="ghost">
                Open initiative
              </Button>
            </div>
          ) : null}
        </div>

        <ProjectActionsMenu
          canDelete={!isPermanentProjectId(activeProject.id)}
          isEditing={isEditing}
          onDeleteProject={() => {
            if (confirm("Delete this project? Tasks will be moved to No Project.")) {
              onDeleteProject(activeProject.id);
              onBack();
            }
          }}
          onToggleEdit={() => setIsEditing((currentValue) => !currentValue)}
        />
      </div>

      {isEditing ? (
        <section className="grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <Input
            autoFocus
            onChange={(event) => setEditName(event.target.value)}
            placeholder="Project name"
            value={editName}
          />
          {featureFlags.initiatives ? (
            <Select
              onValueChange={(value) => setEditInitiativeId(value === "_none" ? "" : value)}
              value={editInitiativeId || "_none"}
            >
              <SelectTrigger>
                <SelectValue placeholder="No initiative" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No initiative</SelectItem>
                {initiatives.map((initiative) => (
                  <SelectItem key={initiative.id} value={initiative.id}>
                    {initiative.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            onChange={(event) => setEditDeadline(event.target.value)}
            type="date"
            value={editDeadline}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditName(activeProject.name);
                setEditInitiativeId(activeProject.initiativeId || "");
                setEditDeadline(activeProject.deadline);
              }}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={!editName.trim()} onClick={handleSaveProject}>
              Save changes
            </Button>
          </div>
        </section>
      ) : null}

      <section className="pt-6">
        <Separator className="mb-6" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Tasks in this project</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Keep the task list readable and the project itself in the foreground.
            </p>
          </div>
          <Button
            onClick={() => setIsTaskComposerOpen((currentValue) => !currentValue)}
            variant={isTaskComposerOpen ? "subtle" : "ghost"}
          >
            <Plus className="size-4" />
            Add task
          </Button>
        </div>

        {isTaskComposerOpen ? (
          <div className="mt-4 grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <Input
              autoFocus
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Task title"
              value={newTaskTitle}
            />
            <Textarea
              onChange={(event) => setNewTaskDetails(event.target.value)}
              placeholder="Task details"
              value={newTaskDetails}
            />
            <Input
              onChange={(event) => setNewTaskTags(event.target.value)}
              placeholder="Tags (comma-separated)"
              value={newTaskTags}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsTaskComposerOpen(false);
                  setNewTaskTitle("");
                  setNewTaskDetails("");
                  setNewTaskTags("");
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={!newTaskTitle.trim()} onClick={handleAddTask}>
                Save task
              </Button>
            </div>
          </div>
        ) : null}

        {childTasks.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">No tasks yet for this project.</p>
        ) : (
          <div className="mt-4">
            {childTasks.map((task, index) => (
              <div key={task.id}>
                {index > 0 ? <Separator /> : null}
                <article className="py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-[color:var(--foreground)]">
                        {task.title}
                      </h3>
                      {task.details ? (
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                          {task.details}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-[color:var(--muted)]">No details yet.</p>
                      )}
                    </div>
                    <div className="shrink-0 text-sm text-[color:var(--muted)]">
                      {task.tags.length > 0 ? (
                        <div className="flex flex-wrap justify-start gap-x-3 gap-y-1 lg:justify-end">
                          {task.tags.map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      ) : (
                        <span>No tags</span>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>

      {canUseProjectThread ? (
        <section className="pt-6">
          <Separator className="mb-6" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Project thread</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Keep agent context nearby without turning it into another dashboard panel.
              </p>
            </div>
            <Button
              onClick={() => setIsThreadOpen((currentValue) => !currentValue)}
              variant="ghost"
            >
              {isThreadOpen
                ? "Hide thread"
                : `Show thread (${activeProject.agentThread.messages.length})`}
            </Button>
          </div>

          {isThreadOpen ? (
            <div className="mt-4">
              <AgentThreadPanel
                activeProviderLabel={activeProviderLabel}
                activeProviderModel={activeProviderModel}
                composerPlaceholder={readThreadComposerPlaceholder({
                  ownerType: "project",
                  ownerId: activeProject.id,
                })}
                draft={readThreadDraft(activeProject.id)}
                isPending={pendingThreadId === activeProject.id}
                onDeleteMessage={(messageId) =>
                  onDeleteThreadMessage(activeProject.id, messageId)
                }
                onDraftChange={(message) => onThreadDraftChange(activeProject.id, message)}
                onSend={() => onSendThreadMessage(activeProject.id)}
                thread={activeProject.agentThread}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

interface ProjectActionsMenuProps {
  canDelete: boolean;
  isEditing: boolean;
  onDeleteProject: () => void;
  onToggleEdit: () => void;
}

function ProjectActionsMenu({
  canDelete,
  isEditing,
  onDeleteProject,
  onToggleEdit,
}: ProjectActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Project actions" size="icon" variant="ghost">
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onToggleEdit}>
          {isEditing ? "Stop editing" : "Edit project"}
        </DropdownMenuItem>
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-600 focus:text-rose-700"
              onSelect={onDeleteProject}
            >
              Delete project
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDeadline(deadline: string) {
  if (!deadline) {
    return "No deadline";
  }

  try {
    const date = new Date(`${deadline}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return deadline;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return deadline;
  }
}

function readTaskCountLabel(taskCount: number) {
  return `${taskCount} ${taskCount === 1 ? "task" : "tasks"}`;
}

function readProjectDetailKey(project: Project) {
  return [
    project.id,
    project.name,
    project.initiativeId,
    project.deadline,
    project.agentThread.messages.length,
  ].join(":");
}
