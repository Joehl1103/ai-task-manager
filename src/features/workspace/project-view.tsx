"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { type Initiative, type Project, type Task } from "./types";

interface ProjectViewProps {
  projects: Project[];
  initiatives: Initiative[];
  tasks: Task[];
  filterInitiativeId: string | null;
  onAddProject: (data: { name: string; initiativeId: string; deadline: string }) => void;
  onUpdateProject: (data: { id: string; name: string; initiativeId: string; deadline: string }) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject: (projectId: string) => void;
  onClearFilter: () => void;
  onAddTask: (data: {
    title: string;
    details: string;
    projectId: string;
    deadline: string;
    tags: string[];
  }) => void;
}

export function ProjectView({
  projects,
  initiatives,
  tasks,
  filterInitiativeId,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
  onClearFilter,
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
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");

  const filteredProjects = filterInitiativeId
    ? projects.filter((p) => p.initiativeId === filterInitiativeId)
    : projects;

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
      deadline: newTaskDeadline,
      tags: parsedTags,
    });
    setNewTaskTitle("");
    setNewTaskDetails("");
    setNewTaskDeadline("");
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
                    <Button
                      onClick={() => {
                        if (confirm("Delete this project? Tasks will be unlinked.")) {
                          onDeleteProject(project.id);
                        }
                      }}
                      size="sm"
                      variant="ghost"
                      className="transition-all duration-150 active:scale-95"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {getChildTasks(project.id).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {getChildTasks(project.id).map((task) => (
                      <div key={task.id} className="text-xs text-[color:var(--muted)]">
                        <p>• {task.title}</p>
                        <p className="ml-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {task.deadline ? <span>Due: {formatDeadline(task.deadline)}</span> : null}
                          {task.tags.length > 0 ? (
                            <span>{task.tags.map((tag) => `#${tag}`).join(" ")}</span>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

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
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        placeholder="Deadline (optional)"
                        type="date"
                        value={newTaskDeadline}
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
                            setNewTaskDeadline("");
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
