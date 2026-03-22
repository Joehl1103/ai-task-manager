"use client";

import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";

import { featureFlags } from "@/features/feature-flags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  filterVisibleProjects,
  isPermanentProjectId,
  supportsProjectThread,
} from "@/features/workspace/projects";
import { collectTaskTags, TaskInlineEditor } from "@/features/workspace/tasks";
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
 * Renders the projects overview as stock-style cards so project metadata and previews stay
 * readable without a bespoke row treatment.
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
          variant={isComposerExpanded ? "outline" : "ghost"}
        >
          <Plus className="size-4" />
          Add project
        </Button>
      </header>

      {isComposerExpanded ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New project</CardTitle>
            <CardDescription>
              Add a project and optionally connect it to an initiative right away.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3">
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
          </CardContent>

          <CardFooter className="justify-end gap-2">
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
          </CardFooter>
        </Card>
      ) : null}

      {visibleProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-32 items-center justify-center px-6 py-6 text-center text-sm text-[color:var(--muted)]">
            No projects yet. Add one to create a new destination in the sidebar.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {visibleProjects.map((project) => {
            const projectInitiative = project.initiativeId
              ? initiatives.find((initiative) => initiative.id === project.initiativeId) ?? null
              : null;
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            const canUseProjectThread = supportsProjectThread(project.id);

            return (
              <button
                className="group block h-full w-full text-left"
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                type="button"
              >
                <Card className="flex h-full flex-col transition-colors group-hover:border-[color:var(--border-strong)] group-hover:bg-[color:var(--surface-muted)]">
                  <CardHeader className="gap-4">
                    <div className="flex flex-wrap gap-2">
                      {featureFlags.initiatives ? (
                        <Badge variant="secondary">
                          {projectInitiative ? projectInitiative.name : "No initiative"}
                        </Badge>
                      ) : null}
                      <Badge>{readTaskCountLabel(projectTasks.length)}</Badge>
                      <Badge>
                        {project.deadline
                          ? `Due ${formatDeadline(project.deadline)}`
                          : "No deadline"}
                      </Badge>
                      {canUseProjectThread ? (
                        <Badge variant="secondary">
                          {project.agentThread.messages.length} messages
                        </Badge>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>
                        {projectTasks.length > 0
                          ? "Open the project to edit tasks and keep thread context nearby."
                          : "No tasks linked yet. Open the project to add the first one."}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Task preview
                    </p>
                    {projectTasks.length > 0 ? (
                      <ul className="space-y-2 text-sm text-[color:var(--muted-strong)]">
                        {projectTasks.slice(0, 2).map((task) => (
                          <li key={task.id}>{task.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[color:var(--muted)]">
                        No tasks linked yet.
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="mt-auto justify-end">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
                      Open project
                    </span>
                  </CardFooter>
                </Card>
              </button>
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
  editDetails: string;
  editingTaskId: string | null;
  editProject: string;
  editTags: string;
  editTitle: string;
  initiatives: Initiative[];
  onAddTask: (data: { title: string; details: string; projectId: string; tags: string[] }) => void;
  onBack: () => void;
  onCancelEdit: () => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteThreadMessage: (projectId: string, messageId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenInitiative: (initiativeId: string) => void;
  onOpenTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onSendThreadMessage: (projectId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  onThreadDraftChange: (projectId: string, message: string) => void;
  onUpdateProject: (data: { id: string; name: string; initiativeId: string; deadline: string }) => void;
  pendingThreadId: string | null;
  project: Project | null;
  projects: Project[];
  readThreadDraft: (projectId: string) => ThreadDraft;
  tasks: Task[];
}

/**
 * Renders one selected project as a card-based detail view that keeps tasks and thread context
 * together without bespoke panel styles.
 */
export function ProjectDetailView({
  activeProviderLabel,
  activeProviderModel,
  editDetails,
  editingTaskId,
  editProject,
  editTags,
  editTitle,
  initiatives,
  onAddTask,
  onBack,
  onCancelEdit,
  onDeleteProject,
  onDeleteThreadMessage,
  onDeleteTask,
  onOpenInitiative,
  onOpenTask,
  onSaveEdit,
  onSendThreadMessage,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onSetEditTitle,
  onThreadDraftChange,
  onUpdateProject,
  pendingThreadId,
  project,
  projects,
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
      editDetails={editDetails}
      editingTaskId={editingTaskId}
      editProject={editProject}
      editTags={editTags}
      editTitle={editTitle}
      initiatives={initiatives}
      key={readProjectDetailKey(project)}
      onAddTask={onAddTask}
      onBack={onBack}
      onCancelEdit={onCancelEdit}
      onDeleteProject={onDeleteProject}
      onDeleteThreadMessage={onDeleteThreadMessage}
      onDeleteTask={onDeleteTask}
      onOpenInitiative={onOpenInitiative}
      onOpenTask={onOpenTask}
      onSaveEdit={onSaveEdit}
      onSendThreadMessage={onSendThreadMessage}
      onSetEditDetails={onSetEditDetails}
      onSetEditProject={onSetEditProject}
      onSetEditTags={onSetEditTags}
      onSetEditTitle={onSetEditTitle}
      onThreadDraftChange={onThreadDraftChange}
      onUpdateProject={onUpdateProject}
      pendingThreadId={pendingThreadId}
      project={project}
      projects={projects}
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
  editDetails,
  editingTaskId,
  editProject,
  editTags,
  editTitle,
  initiatives,
  onAddTask,
  onBack,
  onCancelEdit,
  onDeleteProject,
  onDeleteThreadMessage,
  onDeleteTask,
  onOpenInitiative,
  onOpenTask,
  onSaveEdit,
  onSendThreadMessage,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onSetEditTitle,
  onThreadDraftChange,
  onUpdateProject,
  pendingThreadId,
  project,
  projects,
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
  const visibleProjects = filterVisibleProjects(projects);
  const childTasks = tasks.filter((task) => task.projectId === activeProject.id);
  const allTaskTags = collectTaskTags(tasks);
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
      <Card>
        <CardHeader className="gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-4">
            <Button onClick={onBack} variant="ghost">
              <ArrowLeft className="size-4" />
              Back to projects
            </Button>

            <div className="space-y-2">
              <Badge variant="secondary">Project detail</Badge>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{activeProject.name}</h1>
              <CardDescription>
                Keep tasks, deadlines, initiative links, and thread history inside one stock
                workspace surface.
              </CardDescription>
            </div>
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
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{readTaskCountLabel(childTasks.length)}</Badge>
            <Badge>
              {activeProject.deadline
                ? `Due ${formatDeadline(activeProject.deadline)}`
                : "No deadline"}
            </Badge>
            {featureFlags.initiatives ? (
              <Badge variant="secondary">
                {linkedInitiative ? `Initiative: ${linkedInitiative.name}` : "No initiative"}
              </Badge>
            ) : null}
            {canUseProjectThread ? (
              <Badge variant="secondary">
                {activeProject.agentThread.messages.length} saved messages
              </Badge>
            ) : null}
          </div>

          {featureFlags.initiatives && linkedInitiative ? (
            <div>
              <Button onClick={() => onOpenInitiative(linkedInitiative.id)} variant="outline">
                Open initiative
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit project</CardTitle>
            <CardDescription>Update the core project metadata from one shared form.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3">
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
          </CardContent>

          <CardFooter className="justify-end gap-2">
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
          </CardFooter>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">Tasks in this project</CardTitle>
            <CardDescription>
              Keep the task list readable and editable without leaving the project page.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsTaskComposerOpen((currentValue) => !currentValue)}
            variant={isTaskComposerOpen ? "outline" : "ghost"}
          >
            <Plus className="size-4" />
            Add task
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {isTaskComposerOpen ? (
            <Card className="border-dashed bg-[color:var(--background)] shadow-none">
              <CardHeader>
                <CardTitle className="text-base">New task</CardTitle>
                <CardDescription>Add a task without leaving the project detail view.</CardDescription>
              </CardHeader>

              <CardContent className="grid gap-3">
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
              </CardContent>

              <CardFooter className="justify-end gap-2">
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
              </CardFooter>
            </Card>
          ) : null}

          {childTasks.length === 0 ? (
            <Card className="border-dashed bg-[color:var(--background)] shadow-none">
              <CardContent className="flex min-h-24 items-center justify-center px-6 py-6 text-center text-sm text-[color:var(--muted)]">
                No tasks yet for this project.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {childTasks.map((task) => (
                <ProjectTaskRow
                  allTags={allTaskTags}
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
                  projects={visibleProjects}
                  task={task}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canUseProjectThread ? (
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">Project thread</CardTitle>
              <CardDescription>
                Keep agent context nearby without turning it into another dashboard panel.
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsThreadOpen((currentValue) => !currentValue)}
              variant="ghost"
            >
              {isThreadOpen
                ? "Hide thread"
                : `Show thread (${activeProject.agentThread.messages.length})`}
            </Button>
          </CardHeader>

          {isThreadOpen ? (
            <CardContent>
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
            </CardContent>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

interface ProjectTaskRowProps {
  allTags: string[];
  editDetails: string;
  editingTaskId: string | null;
  editProject: string;
  editTags: string;
  editTitle: string;
  onCancelEdit: () => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onSaveEdit: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  projects: Project[];
  task: Task;
}

/**
 * Keeps project detail task entries inside shared card surfaces while allowing one task to expand
 * inline for editing without replacing the rest of the list.
 */
function ProjectTaskRow({
  allTags,
  editDetails,
  editingTaskId,
  editProject,
  editTags,
  editTitle,
  onCancelEdit,
  onDeleteTask,
  onOpenTask,
  onSaveEdit,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onSetEditTitle,
  projects,
  task,
}: ProjectTaskRowProps) {
  if (task.id === editingTaskId) {
    return (
      <Card className="border-dashed bg-[color:var(--background)] shadow-none">
        <CardContent className="px-4 pb-4 pt-4">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <button
      aria-label={`Open task ${task.title}`}
      className="group block w-full text-left"
      onClick={() => onOpenTask(task.id)}
      type="button"
    >
      <Card className="transition-colors group-hover:border-[color:var(--border-strong)] group-hover:bg-[color:var(--surface-muted)]">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">{task.title}</CardTitle>
              <CardDescription className="mt-2 max-w-2xl leading-6">
                {task.details || "No details yet."}
              </CardDescription>
            </div>

            <div className="flex shrink-0 flex-wrap justify-start gap-2 lg:justify-end">
              {task.tags.length > 0 ? (
                task.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)
              ) : (
                <Badge variant="secondary">Open</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </button>
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
