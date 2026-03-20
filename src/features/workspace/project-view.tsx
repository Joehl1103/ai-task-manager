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
  filterProjectId: string | null;
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
  filterProjectId,
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

      <section className="mt-4">
        <button
          className="flex w-full items-center gap-2 text-left text-sm font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          onClick={() => setIsComposerExpanded(!isComposerExpanded)}
          type="button"
        >
          <Plus className="size-4 shrink-0" />
          <span>Add project</span>
        </button>

        {isComposerExpanded && (
          <div className="mt-3 grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
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
                size="sm"
              >
                Cancel
              </Button>
              <Button
                disabled={!newName.trim()}
                onClick={handleAdd}
                size="sm"
              >
                Add project
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 space-y-1">
        {filteredProjects.length === 0 ? (
          <p className="px-1 text-sm text-[color:var(--muted)]">
            {filterInitiativeId ? "No projects in this initiative." : "No projects yet."}
          </p>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group border-b border-[color:var(--border)] last:border-0"
            >
              {editingId === project.id ? (
                <div className="my-2 space-y-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
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
                    <Button onClick={handleCancelEdit} variant="ghost" size="sm">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} size="sm">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => onSelectProject(project.id)}
                      type="button"
                    >
                      <span className="truncate text-sm font-medium transition-colors group-hover:text-[color:var(--muted-strong)]">
                        {project.name}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
                        {getInitiativeName(project.initiativeId) && (
                          <span className="truncate max-w-[120px]">{getInitiativeName(project.initiativeId)}</span>
                        )}
                        {project.deadline && (
                          <span>Due: {formatDeadline(project.deadline)}</span>
                        )}
                        <span>{getTaskCount(project.id)} tasks</span>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(project);
                        }}
                        size="icon"
                        variant="ghost"
                        className="size-8"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {!isPermanentProjectId(project.id) ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this project? Tasks will be moved to No Project.")) {
                              onDeleteProject(project.id);
                            }
                          }}
                          size="icon"
                          variant="ghost"
                          className="size-8 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {filterProjectId === project.id && (
                    <div className="mt-3 pl-4 border-l-2 border-[color:var(--border-muted)]">
                      {getChildTasks(project.id).length > 0 && (
                        <div className="mb-4 space-y-1.5">
                          {getChildTasks(project.id).map((task) => (
                            <div key={task.id} className="flex items-center gap-2 text-xs text-[color:var(--muted-strong)]">
                              <div className="size-1 rounded-full bg-[color:var(--muted)]" />
                              <span className="truncate">{task.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        <div>
                          <button
                            className="flex items-center gap-2 text-xs font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
                            onClick={() =>
                              setOpenThreadForId((currentThreadId) =>
                                currentThreadId === project.id ? null : project.id,
                              )
                            }
                            type="button"
                          >
                            <span>
                              {openThreadForId === project.id
                                ? "Hide thread"
                                : `Show thread (${project.agentThread.messages.length})`}
                            </span>
                          </button>

                          {openThreadForId === project.id && (
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
                          )}
                        </div>

                        <div>
                          <button
                            className="flex items-center gap-2 text-xs font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
                            onClick={() =>
                              setAddTaskForId(
                                addTaskForId === project.id ? null : project.id,
                              )
                            }
                            type="button"
                          >
                            <Plus className="size-3.5 shrink-0" />
                            <span>Add task</span>
                          </button>

                          {addTaskForId === project.id && (
                            <div className="mt-3 grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                              <Input
                                autoFocus
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Task title"
                                value={newTaskTitle}
                                className="h-8 text-sm"
                              />
                              <Textarea
                                onChange={(e) => setNewTaskDetails(e.target.value)}
                                placeholder="Details (optional)"
                                value={newTaskDetails}
                                className="min-h-[60px] text-sm"
                              />
                              <Input
                                onChange={(e) => setNewTaskTags(e.target.value)}
                                placeholder="Tags (comma-separated, optional)"
                                value={newTaskTags}
                                className="h-8 text-sm"
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
                                >
                                  Cancel
                                </Button>
                                <Button
                                  disabled={!newTaskTitle.trim()}
                                  onClick={() => handleAddChildTask(project.id)}
                                  size="sm"
                                >
                                  Add task
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
