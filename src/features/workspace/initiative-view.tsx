"use client";

import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";

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
 * Renders initiatives as stock-style cards so strategic metadata and linked projects stay readable
 * without a bespoke row layout.
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
          <h1 className="text-2xl font-semibold tracking-tight">Initiatives</h1>
        </div>
        <Button
          aria-expanded={isComposerExpanded}
          onClick={() => setIsComposerExpanded((currentValue) => !currentValue)}
          variant={isComposerExpanded ? "outline" : "ghost"}
        >
          <Plus className="size-4" />
          Add initiative
        </Button>
      </header>

      {isComposerExpanded ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New initiative</CardTitle>
            <CardDescription>
              Add the strategic container first, then attach projects underneath it.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3">
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
          </CardContent>

          <CardFooter className="justify-end gap-2">
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
          </CardFooter>
        </Card>
      ) : null}

      {initiatives.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-32 items-center justify-center px-6 py-6 text-center text-sm text-[color:var(--muted)]">
            No initiatives yet. Add one to create strategic context for your projects.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {initiatives.map((initiative) => {
            const childProjects = projects.filter(
              (project) => project.initiativeId === initiative.id,
            );

            return (
              <button
                className="group block h-full w-full text-left"
                key={initiative.id}
                onClick={() => onSelectInitiative(initiative.id)}
                type="button"
              >
                <Card className="flex h-full flex-col transition-colors group-hover:border-[color:var(--border-strong)] group-hover:bg-[color:var(--surface-muted)]">
                  <CardHeader className="gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{readProjectCountLabel(childProjects.length)}</Badge>
                      <Badge>
                        {initiative.deadline
                          ? `Due ${formatDeadline(initiative.deadline)}`
                          : "No deadline"}
                      </Badge>
                      <Badge variant="secondary">
                        {initiative.agentThread.messages.length} messages
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-lg">{initiative.name}</CardTitle>
                      <CardDescription className="line-clamp-2 leading-6">
                        {initiative.description || "No description yet."}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Linked projects
                    </p>
                    {childProjects.length > 0 ? (
                      <ul className="space-y-2 text-sm text-[color:var(--muted-strong)]">
                        {childProjects.slice(0, 2).map((project) => (
                          <li key={project.id}>{project.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[color:var(--muted)]">
                        No linked projects yet.
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="mt-auto justify-end">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
                      Open initiative
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
 * Renders the selected initiative as a card-based detail view with linked projects and thread
 * context grouped into shared surface sections.
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
      <Card>
        <CardHeader className="gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-4">
            <Button onClick={onBack} variant="ghost">
              <ArrowLeft className="size-4" />
              Back to initiatives
            </Button>

            <div className="space-y-2">
              <Badge variant="secondary">Initiative detail</Badge>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {activeInitiative.name}
              </h1>
              <CardDescription className="max-w-3xl leading-6">
                {activeInitiative.description || "No description yet for this initiative."}
              </CardDescription>
            </div>
          </div>

          <InitiativeActionsMenu
            isEditing={isEditing}
            onDeleteInitiative={() => {
              if (confirm("Delete this initiative? Projects will be unlinked.")) {
                onDeleteInitiative(activeInitiative.id);
                onBack();
              }
            }}
            onToggleEdit={() => setIsEditing((currentValue) => !currentValue)}
          />
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>{readProjectCountLabel(childProjects.length)}</Badge>
            <Badge>
              {activeInitiative.deadline
                ? `Due ${formatDeadline(activeInitiative.deadline)}`
                : "No deadline"}
            </Badge>
            <Badge variant="secondary">
              {activeInitiative.agentThread.messages.length} saved messages
            </Badge>
          </div>
        </CardContent>
      </Card>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit initiative</CardTitle>
            <CardDescription>Update the strategic context from one shared form.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3">
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
          </CardContent>

          <CardFooter className="justify-end gap-2">
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
          </CardFooter>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">Projects inside this initiative</CardTitle>
            <CardDescription>
              Keep linked projects easy to scan and easy to open.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsProjectComposerOpen((currentValue) => !currentValue)}
            variant={isProjectComposerOpen ? "outline" : "ghost"}
          >
            <Plus className="size-4" />
            Add project
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {isProjectComposerOpen ? (
            <Card className="border-dashed bg-[color:var(--background)] shadow-none">
              <CardHeader>
                <CardTitle className="text-base">New project</CardTitle>
                <CardDescription>
                  Add a project directly into this initiative.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-3">
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
              </CardContent>

              <CardFooter className="justify-end gap-2">
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
              </CardFooter>
            </Card>
          ) : null}

          {childProjects.length === 0 ? (
            <Card className="border-dashed bg-[color:var(--background)] shadow-none">
              <CardContent className="flex min-h-24 items-center justify-center px-6 py-6 text-center text-sm text-[color:var(--muted)]">
                No projects linked to this initiative yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {childProjects.map((project) => (
                <button
                  className="group block w-full text-left"
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  type="button"
                >
                  <Card className="transition-colors group-hover:border-[color:var(--border-strong)] group-hover:bg-[color:var(--surface-muted)]">
                    <CardHeader className="gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <CardTitle className="text-base">{project.name}</CardTitle>
                          <CardDescription className="mt-2">
                            {project.deadline
                              ? `Due ${formatDeadline(project.deadline)}`
                              : "No deadline"}
                          </CardDescription>
                        </div>

                        <Badge variant="secondary">Open project</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">Initiative thread</CardTitle>
            <CardDescription>
              Strategic context stays close without boxing in the whole page.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsThreadOpen((currentValue) => !currentValue)}
            variant="ghost"
          >
            {isThreadOpen
              ? "Hide thread"
              : `Show thread (${activeInitiative.agentThread.messages.length})`}
          </Button>
        </CardHeader>

        {isThreadOpen ? (
          <CardContent>
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
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}

interface InitiativeActionsMenuProps {
  isEditing: boolean;
  onDeleteInitiative: () => void;
  onToggleEdit: () => void;
}

function InitiativeActionsMenu({
  isEditing,
  onDeleteInitiative,
  onToggleEdit,
}: InitiativeActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Initiative actions" size="icon" variant="ghost">
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onToggleEdit}>
          {isEditing ? "Stop editing" : "Edit initiative"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-600 focus:text-rose-700"
          onSelect={onDeleteInitiative}
        >
          Delete initiative
        </DropdownMenuItem>
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
