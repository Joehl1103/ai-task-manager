"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { type Initiative, type Project } from "./api";

interface InitiativeViewProps {
  initiatives: Initiative[];
  projects: Project[];
  onAddInitiative: (data: { name: string; description: string; deadline: string }) => void;
  onUpdateInitiative: (data: { id: string; name: string; description: string; deadline: string }) => void;
  onDeleteInitiative: (id: string) => void;
  onSelectInitiative: (initiativeId: string) => void;
}

export function InitiativeView({
  initiatives,
  projects,
  onAddInitiative,
  onUpdateInitiative,
  onDeleteInitiative,
  onSelectInitiative,
}: InitiativeViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

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

  function getProjectCount(initiativeId: string) {
    return projects.filter((p) => p.initiativeId === initiativeId).length;
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
      <header>
        <h1 className="text-2xl font-semibold">Initiatives</h1>
      </header>

      <section className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
        <button
          className="flex w-full items-center gap-2 text-left text-sm text-[color:var(--muted-strong)] transition-all duration-150 cursor-pointer hover:opacity-80 active:opacity-70"
          onClick={() => setIsComposerExpanded(true)}
          type="button"
        >
          <Plus className="size-4" />
          Add initiative
        </button>

        {isComposerExpanded && (
          <div className="mt-3 grid gap-3">
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
        {initiatives.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No initiatives yet.</p>
        ) : (
          initiatives.map((initiative) => (
            <div
              key={initiative.id}
              className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
            >
              {editingId === initiative.id ? (
                <div className="space-y-3">
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
                    <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="transition-all duration-150 active:scale-95">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} size="sm" className="transition-all duration-150 active:scale-95">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-left font-medium hover:text-[color:var(--muted-strong)] transition-all duration-150 cursor-pointer active:opacity-70"
                      onClick={() => onSelectInitiative(initiative.id)}
                      type="button"
                    >
                      {initiative.name}
                    </button>
                    {initiative.description && (
                      <p className="mt-1 text-sm text-[color:var(--muted)] line-clamp-2">
                        {initiative.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-[color:var(--muted)]">
                      {initiative.deadline && (
                        <span>Due: {formatDeadline(initiative.deadline)}</span>
                      )}
                      <span>{getProjectCount(initiative.id)} projects</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleStartEdit(initiative)}
                      size="sm"
                      variant="ghost"
                      className="transition-all duration-150 active:scale-95"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm("Delete this initiative? Projects will be unlinked.")) {
                          onDeleteInitiative(initiative.id);
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
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
