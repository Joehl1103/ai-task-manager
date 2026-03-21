"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type Project, type Task, type ThreadDraft } from "@/features/workspace/core";
import {
  inboxProjectName,
  isHiddenInboxProjectId,
} from "@/features/workspace/projects";
import {
  AgentThreadPanel,
  readThreadComposerPlaceholder,
} from "@/features/workspace/threads";

import { TaskDetailActionsMenu } from "./task-actions-menu";
import { TaskEditorFields } from "./task-editor-fields";

interface TaskDrillDownProps {
  activeProviderLabel: string;
  activeProviderModel: string;
  allTags: string[];
  backLabel?: string;
  editDetails: string;
  editingTaskId: string | null;
  editProject: string;
  editTags: string;
  editTitle: string;
  onCancelEdit: () => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteThreadMessage: (taskId: string, messageId: string) => void;
  onReturnToOverview: () => void;
  onSaveEdit: (taskId: string) => void;
  onSendThreadMessage: (taskId: string) => void;
  onSetEditDetails: (value: string) => void;
  onSetEditProject: (value: string) => void;
  onSetEditTags: (value: string) => void;
  onSetEditTitle: (value: string) => void;
  onStartEdit: (taskId: string) => void;
  onThreadDraftChange: (taskId: string, message: string) => void;
  pendingTaskId: string | null;
  projects: Project[];
  task: Task;
  threadDraft: ThreadDraft;
}

/**
 * Keeps the selected-task experience visually consistent across inbox, all-tasks, and project
 * detail views.
 */
export function TaskDrillDown({
  activeProviderLabel,
  activeProviderModel,
  allTags,
  backLabel = "Back",
  editDetails,
  editingTaskId,
  editProject,
  editTags,
  editTitle,
  onCancelEdit,
  onDeleteTask,
  onDeleteThreadMessage,
  onReturnToOverview,
  onSaveEdit,
  onSendThreadMessage,
  onSetEditDetails,
  onSetEditProject,
  onSetEditTags,
  onSetEditTitle,
  onStartEdit,
  onThreadDraftChange,
  pendingTaskId,
  projects,
  task,
  threadDraft,
}: TaskDrillDownProps) {
  const isEditing = editingTaskId === task.id;
  const isCallingTask = pendingTaskId === task.id;
  const projectName = readTaskProjectName(task, projects);

  return (
    <article className="mt-2 space-y-4">
      <Button onClick={onReturnToOverview} size="sm" variant="ghost">
        <ArrowLeft className="size-4" />
        {backLabel}
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{task.title}</h2>
          {projectName ? (
            <p className="mt-1 text-xs text-[color:var(--muted)]">{projectName}</p>
          ) : null}
          {task.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span
                  className="rounded-full bg-[color:var(--surface-muted)] px-2 py-0.5 text-[11px] text-[color:var(--muted)]"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <TaskDetailActionsMenu
          isEditing={isEditing}
          onDeleteTask={() => onDeleteTask(task.id)}
          onStartEdit={() => onStartEdit(task.id)}
        />
      </div>

      {isEditing ? (
        <TaskEditorFields
          allTags={allTags}
          details={editDetails}
          isSubmitDisabled={!editTitle.trim()}
          onCancel={onCancelEdit}
          onDetailsChange={onSetEditDetails}
          onProjectChange={onSetEditProject}
          onSubmit={() => onSaveEdit(task.id)}
          onTagsChange={onSetEditTags}
          onTitleChange={onSetEditTitle}
          projectId={editProject}
          projects={projects}
          submitHint="⌘↵"
          submitLabel="Save"
          tags={editTags}
          title={editTitle}
        />
      ) : (
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          {task.details || "No details yet."}
        </p>
      )}

      <AgentThreadPanel
        activeProviderLabel={activeProviderLabel}
        activeProviderModel={activeProviderModel}
        composerPlaceholder={readThreadComposerPlaceholder({
          ownerType: "task",
          ownerId: task.id,
        })}
        draft={threadDraft}
        isPending={isCallingTask}
        onDeleteMessage={(messageId) => onDeleteThreadMessage(task.id, messageId)}
        onDraftChange={(message) => onThreadDraftChange(task.id, message)}
        onSend={() => onSendThreadMessage(task.id)}
        thread={task.agentThread}
      />
    </article>
  );
}

/**
 * Resolves the quiet project label shown in the drill-down header, including the hidden inbox
 * bucket.
 */
function readTaskProjectName(task: Task, projects: Project[]) {
  if (isHiddenInboxProjectId(task.projectId)) {
    return inboxProjectName;
  }

  return projects.find((project) => project.id === task.projectId)?.name ?? null;
}
