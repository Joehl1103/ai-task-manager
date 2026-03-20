"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  filterVisibleProjects,
  isPermanentProjectId,
} from "@/features/workspace/projects";
import { type Initiative, type Project, type Task, type ThreadDraft } from "@/features/workspace/core";
import { AgentThreadPanel, readThreadComposerPlaceholder } from "@/features/workspace/threads";

interface ProjectViewProps {
  activeProviderLabel: string;
  activeProviderModel: string;
  projects: Project[];
  initiatives: Initiative[];
  tasks: Task[];
  filterInitiativeId: string | null;
  pendingThreadId: string | null;
  readThreadDraft: (projectId: string) => ThreadDraft;
  onAddProject: (data: { name: string; initiativeId: string; deadline: string }) => void;
  onUpdateProject: (data: { id: string; name: string; initiativeId: string; deadline: string }) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject: (projectId: string) => void;
  onClearFilter: () => void;
  onDeleteThreadMessage: (projectId: string, messageId: string) => void;
  onThreadDraftChange: (projectId: string, message: string) => void;
  onSendThreadMessage: (projectId: string) => void;
  onAddTask: (data: { title: string; details: string; projectId: string; tags: string[] }) => void;
}

export function ProjectView({
  activeProviderLabel,
  activeProviderModel,
  projects,
  initiatives,
  tasks,
  filterInitiativeId,
  pendingThreadId,
  readThreadDraft,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
  onClearFilter,
  onDeleteThreadMessage,
  onThreadDraftChange,
  onSendThreadMessage,
  onAddTask,
}: ProjectViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newName, setNewName] = useState("");
  const [newInitiativeId, setNewInitiativeId] = useState(filterInitiativeId || "");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editInitiativeId, setEditInitiativeId] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [addTaskForId, setAddTaskForId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");
  const [openThreadForId, setOpenThreadForId] = useState<string | null>(null);
  const visibleProjects = filterVisibleProjects(projects);

  const filteredProjects = filterInitiativeId
    ? visibleProjects.filter((project) => project.initiativeId === filterInitiativeId)
    : visibleProjects;

  const filterInitiative = filterInitiativeId
    ? initiatives.find((i) => i.id === filterInitiativeId)
    : null;

  function handleAdd() {
    if (!newName.trim()) return;
    onAddProject({
      name: newName,
      initiativeId: newInitiativeId,
      deadline: newDeadline,
    });
    setNewName("");
    setNewInitiativeId(filterInitiativeId || "");
    setNewDeadline("");
    setIsComposerExpanded(false);
  }

  function handleStartEdit(project: Project) {
    setEditingId(project.id);
    setEditName(project.name);
    setEditInitiativeId(project.initiativeId || "");
    setEditDeadline(project.deadline);
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    onUpdateProject({
      id: editingId,
      name: editName,
      initiativeId: editInitiativeId,
      deadline: editDeadline,
    });
    setEditingId(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  function getChildTasks(projectId: string) {
    return tasks.filter((t) => t.projectId === projectId);
  }

  function getTaskCount(projectId: string) {
    return getChildTasks(projectId).length;
  }

  function handleAddChildTask(projectId: string) {
    if (!newTaskTitle.trim()) return;
    const parsedTags = newTaskTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    onAddTask({
      title: newTaskTitle,
      details: newTaskDetails,
      projectId,
      tags: parsedTags,
    });
    setNewTaskTitle("");
    setNewTaskDetails("");
    setNewTaskTags("");
    setAddTaskForId(null);
  }

  function getInitiativeName(initiativeId: string | null) {
    if (!initiativeId) return null;
    return initiatives.find((i) => i.id === initiativeId)?.name || null;
  }

  function formatDeadline(deadline: string) {
    if (!deadline) return null;
    try {
      return new Date(deadline).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return deadline;
    }
  }

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          {filterInitiative && (
            <p className="text-sm text-[color:var(--muted)]">
              Filtered by: {filterInitiative.name}
              <button
                className="ml-2 text-[color:var(--foreground)] underline transition-all duration-150 cursor-pointer active:opacity-70"
                onClick={onClearFilter}
                type="button"
              >
                Clear
              </button>
            </p>
          )}
        </div>
      </header>

      <section className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
        <button
          className="flex w-full items-center gap-2 text-left text-sm text-[color:var(--muted-strong)] transition-all duration-150 cursor-pointer hover:opacity-80 active:opacity-70"
          onClick={() => setIsComposerExpanded(true)}
          type="button"
        >
          <Plus className="size-4" />
          Add project
        </button>

        {isComposerExpanded && (
          <div className="mt-3 grid gap-3">
            <Input
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              value={newName}
            />
            <select
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
              onChange={(e) => setNewInitiativeId(e.target.value)}
              value={newInitiativeId}
            >
              <option value="">No initiative</option>
              {initiatives.map((initiative) => (
                <option key={initiative.id} value={initiative.id}>
                  {initiative.name}
                </option>
              ))}
            </select>
            <Input
              onChange={(e) => setNewDeadline(e.target.value)}
              placeholder="Deadline"
              type="date"
              value={newDeadline}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsComposerExpanded(false);
                  setNewName("");
                  setNewInitiativeId(filterInitiativeId || "");
                  setNewDeadline("");
                }}
                variant="ghost"
                className="transition-all duration-150 active:scale-95"
              >
                Cancel
              </Button>
              <Button
                disabled={!newName.trim()}
                onClick={handleAdd}
                className="transition-all duration-150 active:scale-95"
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 space-y-3">
        {filteredProjects.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            {filterInitiativeId ? "No projects in this initiative." : "No projects yet."}
          </p>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
            >
              {editingId === project.id ? (
                <div className="space-y-3">
                  <Input
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Project name"
                    value={editName}
                  />
                  <select
                    className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
                    onChange={(e) => setEditInitiativeId(e.target.value)}
                    value={editInitiativeId}
                  >
                    <option value="">No initiative</option>
                    {initiatives.map((initiative) => (
                      <option key={initiative.id} value={initiative.id}>
                        {initiative.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    onChange={(e) => setEditDeadline(e.target.value)}
                    type="date"
                    value={editDeadline}
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="transition-all duration-150 active:scale-95">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} size="sm" className="transition-all duration-150 active:scale-95">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-left font-medium hover:text-[color:var(--muted-strong)] transition-all duration-150 cursor-pointer active:opacity-70"
                      onClick={() => onSelectProject(project.id)}
                      type="button"
                    >
                      {project.name}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--muted)]">
                      {getInitiativeName(project.initiativeId) && (
                        <span>{getInitiativeName(project.initiativeId)}</span>
                      )}
                      {project.deadline && (
                        <span>Due: {formatDeadline(project.deadline)}</span>
                      )}
                      <span>{getTaskCount(project.id)} tasks</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleStartEdit(project)}
                      size="sm"
                      variant="ghost"
                      className="transition-all duration-150 active:scale-95"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {!isPermanentProjectId(project.id) ? (
                      <Button
                        onClick={() => {
                          if (confirm("Delete this project? Tasks will be moved to No Project.")) {
                            onDeleteProject(project.id);
                          }
                        }}
                        size="sm"
                        variant="ghost"
                        className="transition-all duration-150 active:scale-95"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>

                {getChildTasks(project.id).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {getChildTasks(project.id).map((task) => (
                      <p key={task.id} className="text-xs text-[color:var(--muted)]">
                        • {task.title}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  <button
                    className="flex items-center gap-1 text-xs text-[color:var(--muted-strong)] transition-all duration-150 cursor-pointer hover:opacity-80 active:opacity-70"
                    onClick={() =>
                      setOpenThreadForId((currentThreadId) =>
                        currentThreadId === project.id ? null : project.id,
                      )
                    }
                    type="button"
                  >
                    {openThreadForId === project.id
                      ? "Hide thread"
                      : `Show thread (${project.agentThread.messages.length})`}
                  </button>

                  {openThreadForId === project.id ? (
                    <div className="mt-3">
                      <AgentThreadPanel
                        activeProviderLabel={activeProviderLabel}
                        activeProviderModel={activeProviderModel}
                        composerPlaceholder={readThreadComposerPlaceholder({
                          ownerType: "project",
                          ownerId: project.id,
                        })}
                        draft={readThreadDraft(project.id)}
                        isPending={pendingThreadId === project.id}
                        onDeleteMessage={(messageId) => onDeleteThreadMessage(project.id, messageId)}
                        onDraftChange={(message) => onThreadDraftChange(project.id, message)}
                        onSend={() => onSendThreadMessage(project.id)}
                        thread={project.agentThread}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="mt-3">
                  <button
                    className="flex items-center gap-1 text-xs text-[color:var(--muted-strong)] transition-all duration-150 cursor-pointer hover:opacity-80 active:opacity-70"
                    onClick={() =>
                      setAddTaskForId(
                        addTaskForId === project.id ? null : project.id,
                      )
                    }
                    type="button"
                  >
                    <Plus className="size-3" />
                    Add task
                  </button>

                  {addTaskForId === project.id && (
                    <div className="mt-2 grid gap-2">
                      <Input
                        autoFocus
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title"
                        value={newTaskTitle}
                      />
                      <Textarea
                        onChange={(e) => setNewTaskDetails(e.target.value)}
                        placeholder="Details (optional)"
                        value={newTaskDetails}
                      />
                      <Input
                        onChange={(e) => setNewTaskTags(e.target.value)}
                        placeholder="Tags (comma-separated, optional)"
                        value={newTaskTags}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => {
                            setAddTaskForId(null);
                            setNewTaskTitle("");
                            setNewTaskDetails("");
                            setNewTaskTags("");
                          }}
                          variant="ghost"
                          size="sm"
                          className="transition-all duration-150 active:scale-95"
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={!newTaskTitle.trim()}
                          onClick={() => handleAddChildTask(project.id)}
                          size="sm"
                          className="transition-all duration-150 active:scale-95"
                        >
                          <Plus className="size-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                </>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
