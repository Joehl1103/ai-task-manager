"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Initiative, type Project, type ThreadDraft } from "@/features/workspace/core";
import { AgentThreadPanel, readThreadComposerPlaceholder } from "@/features/workspace/threads";

interface InitiativeViewProps {
  activeProviderLabel: string;
  activeProviderModel: string;
  initiatives: Initiative[];
  projects: Project[];
  pendingThreadId: string | null;
  readThreadDraft: (initiativeId: string) => ThreadDraft;
  onAddInitiative: (data: { name: string; description: string; deadline: string }) => void;
  onUpdateInitiative: (data: { id: string; name: string; description: string; deadline: string }) => void;
  onDeleteInitiative: (id: string) => void;
  onSelectInitiative: (initiativeId: string) => void;
  onAddProject: (data: { name: string; initiativeId: string; deadline: string }) => void;
  onDeleteThreadMessage: (initiativeId: string, messageId: string) => void;
  onThreadDraftChange: (initiativeId: string, message: string) => void;
  onSendThreadMessage: (initiativeId: string) => void;
}

export function InitiativeView({
  activeProviderLabel,
  activeProviderModel,
  initiatives,
  projects,
  pendingThreadId,
  readThreadDraft,
  onAddInitiative,
  onUpdateInitiative,
  onDeleteInitiative,
  onSelectInitiative,
  onAddProject,
  onDeleteThreadMessage,
  onThreadDraftChange,
  onSendThreadMessage,
}: InitiativeViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [addProjectForId, setAddProjectForId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  const [openThreadForId, setOpenThreadForId] = useState<string | null>(null);

  function handleAdd() {
    if (!newName.trim()) return;
    onAddInitiative({
      name: newName,
      description: newDescription,
      deadline: newDeadline,
    });
    setNewName("");
    setNewDescription("");
    setNewDeadline("");
    setIsComposerExpanded(false);
  }

  function handleStartEdit(initiative: Initiative) {
    setEditingId(initiative.id);
    setEditName(initiative.name);
    setEditDescription(initiative.description);
    setEditDeadline(initiative.deadline);
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    onUpdateInitiative({
      id: editingId,
      name: editName,
      description: editDescription,
      deadline: editDeadline,
    });
    setEditingId(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  function getChildProjects(initiativeId: string) {
    return projects.filter((p) => p.initiativeId === initiativeId);
  }

  function getProjectCount(initiativeId: string) {
    return getChildProjects(initiativeId).length;
  }

  function getProjectCountLabel(initiativeId: string) {
    const projectCount = getProjectCount(initiativeId);

    return `${projectCount} ${projectCount === 1 ? "project" : "projects"}`;
  }

  function handleAddChildProject(initiativeId: string) {
    if (!newProjectName.trim()) return;
    onAddProject({
      name: newProjectName,
      initiativeId,
      deadline: newProjectDeadline,
    });
    setNewProjectName("");
    setNewProjectDeadline("");
    setAddProjectForId(null);
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
      <header>
        <h1 className="text-2xl font-semibold">Initiatives</h1>
      </header>

      <section className="mt-4">
        <button
          className="flex w-full items-center gap-2 text-left text-sm font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          onClick={() => setIsComposerExpanded(!isComposerExpanded)}
          type="button"
        >
          <Plus className="size-4 shrink-0" />
          <span>Add initiative</span>
        </button>

        {isComposerExpanded && (
          <div className="mt-3 grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
            <Input
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Initiative name"
              value={newName}
            />
            <Input
              onChange={(e) => setNewDeadline(e.target.value)}
              placeholder="Deadline (YYYY-MM-DD)"
              type="date"
              value={newDeadline}
            />
            <Textarea
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              value={newDescription}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsComposerExpanded(false);
                  setNewName("");
                  setNewDescription("");
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
                Add initiative
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 space-y-1">
        {initiatives.length === 0 ? (
          <p className="px-1 text-sm text-[color:var(--muted)]">No initiatives yet.</p>
        ) : (
          initiatives.map((initiative) => (
            <div
              key={initiative.id}
              className="group border-b border-[color:var(--border)] last:border-0"
            >
              {editingId === initiative.id ? (
                <div className="my-2 space-y-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <Input
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Initiative name"
                    value={editName}
                  />
                  <Input
                    onChange={(e) => setEditDeadline(e.target.value)}
                    type="date"
                    value={editDeadline}
                  />
                  <Textarea
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                    value={editDescription}
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
                      onClick={() => onSelectInitiative(initiative.id)}
                      type="button"
                    >
                      <span className="truncate text-sm font-medium transition-colors group-hover:text-[color:var(--muted-strong)]">
                        {initiative.name}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
                        {initiative.deadline && (
                          <span>Due: {formatDeadline(initiative.deadline)}</span>
                        )}
                        <span>{getProjectCountLabel(initiative.id)}</span>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(initiative);
                        }}
                        size="icon"
                        variant="ghost"
                        className="size-8"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this initiative? Projects will be unlinked.")) {
                            onDeleteInitiative(initiative.id);
                          }
                        }}
                        size="icon"
                        variant="ghost"
                        className="size-8 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {initiative.description && (
                    <p className="mt-1 pl-6 text-sm text-[color:var(--muted)] line-clamp-2">
                      {initiative.description}
                    </p>
                  )}

                  <div className="mt-3 pl-4 border-l-2 border-[color:var(--border-muted)]">
                    {getChildProjects(initiative.id).length > 0 && (
                      <div className="mb-4 space-y-1.5">
                        {getChildProjects(initiative.id).map((project) => (
                          <div key={project.id} className="flex items-center gap-2 text-xs text-[color:var(--muted-strong)]">
                            <div className="size-1 rounded-full bg-[color:var(--muted)]" />
                            <span className="truncate">{project.name}</span>
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
                              currentThreadId === initiative.id ? null : initiative.id,
                            )
                          }
                          type="button"
                        >
                          <span>
                            {openThreadForId === initiative.id
                              ? "Hide thread"
                              : `Show thread (${initiative.agentThread.messages.length})`}
                          </span>
                        </button>

                        {openThreadForId === initiative.id && (
                          <div className="mt-3">
                            <AgentThreadPanel
                              activeProviderLabel={activeProviderLabel}
                              activeProviderModel={activeProviderModel}
                              composerPlaceholder={readThreadComposerPlaceholder({
                                ownerType: "initiative",
                                ownerId: initiative.id,
                              })}
                              draft={readThreadDraft(initiative.id)}
                              isPending={pendingThreadId === initiative.id}
                              onDeleteMessage={(messageId) => onDeleteThreadMessage(initiative.id, messageId)}
                              onDraftChange={(message) => onThreadDraftChange(initiative.id, message)}
                              onSend={() => onSendThreadMessage(initiative.id)}
                              thread={initiative.agentThread}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <button
                          className="flex items-center gap-2 text-xs font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
                          onClick={() =>
                            setAddProjectForId(
                              addProjectForId === initiative.id ? null : initiative.id,
                            )
                          }
                          type="button"
                        >
                          <Plus className="size-3.5 shrink-0" />
                          <span>Add project</span>
                        </button>

                        {addProjectForId === initiative.id && (
                          <div className="mt-3 grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                            <Input
                              autoFocus
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="Project name"
                              value={newProjectName}
                              className="h-8 text-sm"
                            />
                            <Input
                              onChange={(e) => setNewProjectDeadline(e.target.value)}
                              placeholder="Deadline"
                              type="date"
                              value={newProjectDeadline}
                              className="h-8 text-sm"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => {
                                  setAddProjectForId(null);
                                  setNewProjectName("");
                                  setNewProjectDeadline("");
                                }}
                                variant="ghost"
                                size="sm"
                              >
                                Cancel
                              </Button>
                              <Button
                                disabled={!newProjectName.trim()}
                                onClick={() => handleAddChildProject(initiative.id)}
                                size="sm"
                              >
                                Add project
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
