"use client";

import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type Initiative,
  type Project,
  type ThreadDraft,
} from "@/features/workspace/core";
import {
  AgentThreadPanel,
  readThreadComposerPlaceholder,
} from "@/features/workspace/threads";

interface InitiativeViewProps {
  initiatives: Initiative[];
  onAddInitiative: (data: { name: string; description: string; deadline: string }) => void;
  onSelectInitiative: (initiativeId: string) => void;
  projects: Project[];
}

/**
 * Renders initiatives as a text-forward list so hierarchy comes from spacing and copy.
 */
export function InitiativeView({
  initiatives,
  onAddInitiative,
  onSelectInitiative,
  projects,
}: InitiativeViewProps) {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  function handleAdd() {
    if (!newName.trim()) {
      return;
    }

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

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Initiatives</h1>
        </div>
        <Button
          aria-expanded={isComposerExpanded}
          onClick={() => setIsComposerExpanded((currentValue) => !currentValue)}
          variant={isComposerExpanded ? "subtle" : "ghost"}
        >
          <Plus className="size-4" />
          Add initiative
        </Button>
      </header>

      {isComposerExpanded ? (
        <section className="grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <Input
            autoFocus
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Initiative name"
            value={newName}
          />
          <Input
            onChange={(event) => setNewDeadline(event.target.value)}
            placeholder="Deadline"
            type="date"
            value={newDeadline}
          />
          <Textarea
            onChange={(event) => setNewDescription(event.target.value)}
            placeholder="Description"
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
            >
              Cancel
            </Button>
            <Button disabled={!newName.trim()} onClick={handleAdd}>
              Save initiative
            </Button>
          </div>
        </section>
      ) : null}

      {initiatives.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">
          No initiatives yet. Add one to create strategic context for your projects.
        </p>
      ) : (
        <section className="border-t border-[color:var(--row-divider)]">
          {initiatives.map((initiative) => {
            const childProjects = projects.filter(
              (project) => project.initiativeId === initiative.id,
            );

            return (
              <button
                className="group block w-full border-b border-[color:var(--row-divider)] py-4 text-left transition-colors hover:bg-[color:var(--row-hover)]"
                key={initiative.id}
                onClick={() => onSelectInitiative(initiative.id)}
                type="button"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-medium text-[color:var(--foreground)]">
                        {initiative.name}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {readProjectCountLabel(childProjects.length)}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {initiative.deadline
                          ? `Due ${formatDeadline(initiative.deadline)}`
                          : "No deadline"}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {initiative.agentThread.messages.length} messages
                      </p>
                    </div>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)] line-clamp-2">
                      {initiative.description || "No description yet."}
                    </p>

                    {childProjects.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[color:var(--muted)]">
                        {childProjects.slice(0, 2).map((project) => (
                          <span key={project.id}>{project.name}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
                    Open
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}

interface InitiativeDetailViewProps {
  activeProviderLabel: string;
  activeProviderModel: string;
  initiative: Initiative | null;
  onAddProject: (data: { name: string; initiativeId: string; deadline: string }) => void;
  onBack: () => void;
  onDeleteInitiative: (initiativeId: string) => void;
  onDeleteThreadMessage: (initiativeId: string, messageId: string) => void;
  onSelectProject: (projectId: string) => void;
  onSendThreadMessage: (initiativeId: string) => void;
  onThreadDraftChange: (initiativeId: string, message: string) => void;
  onUpdateInitiative: (data: { id: string; name: string; description: string; deadline: string }) => void;
  pendingThreadId: string | null;
  projects: Project[];
  readThreadDraft: (initiativeId: string) => ThreadDraft;
}

/**
 * Renders the selected initiative as a minimal detail view with linked projects beneath it.
 */
export function InitiativeDetailView({
  activeProviderLabel,
  activeProviderModel,
  initiative,
  onAddProject,
  onBack,
  onDeleteInitiative,
  onDeleteThreadMessage,
  onSelectProject,
  onSendThreadMessage,
  onThreadDraftChange,
  onUpdateInitiative,
  pendingThreadId,
  projects,
  readThreadDraft,
}: InitiativeDetailViewProps) {
  if (!initiative) {
    return (
      <section className="py-12">
        <p className="text-lg font-medium">Initiative not found</p>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          The selected initiative is no longer available.
        </p>
      </section>
    );
  }

  return (
    <InitiativeDetailContent
      activeProviderLabel={activeProviderLabel}
      activeProviderModel={activeProviderModel}
      initiative={initiative}
      key={readInitiativeDetailKey(initiative)}
      onAddProject={onAddProject}
      onBack={onBack}
      onDeleteInitiative={onDeleteInitiative}
      onDeleteThreadMessage={onDeleteThreadMessage}
      onSelectProject={onSelectProject}
      onSendThreadMessage={onSendThreadMessage}
      onThreadDraftChange={onThreadDraftChange}
      onUpdateInitiative={onUpdateInitiative}
      pendingThreadId={pendingThreadId}
      projects={projects}
      readThreadDraft={readThreadDraft}
    />
  );
}

interface InitiativeDetailContentProps
  extends Omit<InitiativeDetailViewProps, "initiative"> {
  initiative: Initiative;
}

function InitiativeDetailContent({
  activeProviderLabel,
  activeProviderModel,
  initiative,
  onAddProject,
  onBack,
  onDeleteInitiative,
  onDeleteThreadMessage,
  onSelectProject,
  onSendThreadMessage,
  onThreadDraftChange,
  onUpdateInitiative,
  pendingThreadId,
  projects,
  readThreadDraft,
}: InitiativeDetailContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(initiative.name);
  const [editDescription, setEditDescription] = useState(initiative.description);
  const [editDeadline, setEditDeadline] = useState(initiative.deadline);
  const [isProjectComposerOpen, setIsProjectComposerOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  const activeInitiative = initiative;
  const childProjects = projects.filter(
    (project) => project.initiativeId === activeInitiative.id,
  );

  function handleSaveInitiative() {
    if (!editName.trim()) {
      return;
    }

    onUpdateInitiative({
      id: activeInitiative.id,
      name: editName,
      description: editDescription,
      deadline: editDeadline,
    });
    setIsEditing(false);
  }

  function handleAddProject() {
    if (!newProjectName.trim()) {
      return;
    }

    onAddProject({
      name: newProjectName,
      initiativeId: activeInitiative.id,
      deadline: newProjectDeadline,
    });
    setNewProjectName("");
    setNewProjectDeadline("");
    setIsProjectComposerOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <Button onClick={onBack} variant="ghost">
            <ArrowLeft className="size-4" />
            Back to initiatives
          </Button>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Initiative detail
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {activeInitiative.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
            {activeInitiative.description || "No description yet for this initiative."}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[color:var(--muted)]">
            <span>{readProjectCountLabel(childProjects.length)}</span>
            <span>
              {activeInitiative.deadline
                ? `Due ${formatDeadline(activeInitiative.deadline)}`
                : "No deadline"}
            </span>
            <span>{activeInitiative.agentThread.messages.length} saved messages</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsEditing((currentValue) => !currentValue)}
            variant="ghost"
          >
            <Pencil className="size-4" />
            {isEditing ? "Stop editing" : "Edit initiative"}
          </Button>
          <Button
            onClick={() => {
              if (confirm("Delete this initiative? Projects will be unlinked.")) {
                onDeleteInitiative(activeInitiative.id);
                onBack();
              }
            }}
            variant="ghost"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <section className="grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <Input
            autoFocus
            onChange={(event) => setEditName(event.target.value)}
            placeholder="Initiative name"
            value={editName}
          />
          <Input
            onChange={(event) => setEditDeadline(event.target.value)}
            type="date"
            value={editDeadline}
          />
          <Textarea
            onChange={(event) => setEditDescription(event.target.value)}
            placeholder="Description"
            value={editDescription}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditName(activeInitiative.name);
                setEditDescription(activeInitiative.description);
                setEditDeadline(activeInitiative.deadline);
              }}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={!editName.trim()} onClick={handleSaveInitiative}>
              Save changes
            </Button>
          </div>
        </section>
      ) : null}

      <section className="border-t border-[color:var(--row-divider)] pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Projects inside this initiative</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Keep linked projects easy to scan and easy to open.
            </p>
          </div>
          <Button
            onClick={() => setIsProjectComposerOpen((currentValue) => !currentValue)}
            variant={isProjectComposerOpen ? "subtle" : "ghost"}
          >
            <Plus className="size-4" />
            Add project
          </Button>
        </div>

        {isProjectComposerOpen ? (
          <div className="mt-4 grid gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <Input
              autoFocus
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Project name"
              value={newProjectName}
            />
            <Input
              onChange={(event) => setNewProjectDeadline(event.target.value)}
              placeholder="Deadline"
              type="date"
              value={newProjectDeadline}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsProjectComposerOpen(false);
                  setNewProjectName("");
                  setNewProjectDeadline("");
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={!newProjectName.trim()} onClick={handleAddProject}>
                Save project
              </Button>
            </div>
          </div>
        ) : null}

        {childProjects.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            No projects linked to this initiative yet.
          </p>
        ) : (
          <div className="mt-4 border-t border-[color:var(--row-divider)]">
            {childProjects.map((project) => (
              <button
                className="group flex w-full items-start justify-between gap-3 border-b border-[color:var(--row-divider)] py-4 text-left transition-colors hover:bg-[color:var(--row-hover)]"
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                type="button"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-[color:var(--foreground)]">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {project.deadline ? `Due ${formatDeadline(project.deadline)}` : "No deadline"}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
                  Open project
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-[color:var(--row-divider)] pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Initiative thread</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Strategic context stays close without boxing in the whole page.
            </p>
          </div>
          <Button
            onClick={() => setIsThreadOpen((currentValue) => !currentValue)}
            variant="ghost"
          >
            {isThreadOpen
              ? "Hide thread"
              : `Show thread (${activeInitiative.agentThread.messages.length})`}
          </Button>
        </div>

        {isThreadOpen ? (
          <div className="mt-4">
            <AgentThreadPanel
              activeProviderLabel={activeProviderLabel}
              activeProviderModel={activeProviderModel}
              composerPlaceholder={readThreadComposerPlaceholder({
                ownerType: "initiative",
                ownerId: activeInitiative.id,
              })}
              draft={readThreadDraft(activeInitiative.id)}
              isPending={pendingThreadId === activeInitiative.id}
              onDeleteMessage={(messageId) =>
                onDeleteThreadMessage(activeInitiative.id, messageId)
              }
              onDraftChange={(message) => onThreadDraftChange(activeInitiative.id, message)}
              onSend={() => onSendThreadMessage(activeInitiative.id)}
              thread={activeInitiative.agentThread}
            />
          </div>
        ) : null}
      </section>
    </div>
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

function readProjectCountLabel(projectCount: number) {
  return `${projectCount} ${projectCount === 1 ? "project" : "projects"}`;
}

function readInitiativeDetailKey(initiative: Initiative) {
  return [
    initiative.id,
    initiative.name,
    initiative.description,
    initiative.deadline,
    initiative.agentThread.messages.length,
  ].join(":");
}
