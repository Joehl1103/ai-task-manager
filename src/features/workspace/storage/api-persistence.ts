import type {
  AgentThreadMessage,
  Initiative,
  Project,
  Task,
  ThreadOwnerRef,
  WorkspaceSnapshot,
} from "@/features/workspace/core";
import { normalizeWorkspaceSnapshot } from "./workspace-storage";
import type { WorkspacePersistence } from "./workspace-persistence";

/**
 * Persists workspace data through the Next.js API routes backed by PostgreSQL.
 * Every write is fire-and-forget from the caller's perspective — the UI stays
 * optimistic and localStorage mirrors the latest state as an offline cache.
 */
export function createApiPersistence(): WorkspacePersistence {
  return {
    loadWorkspace,
    saveTask,
    deleteTask,
    saveProject,
    deleteProject,
    saveInitiative,
    deleteInitiative,
    saveThreadMessage,
    deleteThreadMessage,
  };
}

// ---------------------------------------------------------------------------
// Workspace snapshot
// ---------------------------------------------------------------------------

/**
 * Fetches the full workspace from the API and normalizes it into the app's
 * expected shape. Falls back to the normalizer's defaults if the response is
 * malformed.
 */
async function loadWorkspace(): Promise<WorkspaceSnapshot> {
  const response = await fetch("/api/workspace");

  if (!response.ok) {
    throw new Error(`Workspace fetch failed: ${response.status}`);
  }

  const raw = await response.json();

  return normalizeWorkspaceSnapshot(raw);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

async function saveTask(task: Task): Promise<void> {
  // Try PUT first (update), fall back to POST (create) on 404
  const putResponse = await fetch("/api/tasks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: task.id,
      title: task.title,
      details: task.details,
      completed: task.completed,
      projectId: task.projectId,
      deadline: task.deadline,
      tags: task.tags,
      completedAt: task.completedAt,
      remindOn: task.remindOn,
      dueBy: task.dueBy,
    }),
  });

  if (putResponse.ok) return;

  if (putResponse.status === 404) {
    const postResponse = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        title: task.title,
        details: task.details,
        completed: task.completed,
        projectId: task.projectId,
        deadline: task.deadline,
        tags: task.tags,
        completedAt: task.completedAt,
        remindOn: task.remindOn,
        dueBy: task.dueBy,
      }),
    });

    if (!postResponse.ok) {
      console.error("Failed to create task via API:", await postResponse.text());
    }

    return;
  }

  console.error("Failed to save task via API:", await putResponse.text());
}

async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks?id=${encodeURIComponent(taskId)}`, { method: "DELETE" });

  if (!response.ok) {
    console.error("Failed to delete task via API:", await response.text());
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

async function saveProject(project: Project): Promise<void> {
  const putResponse = await fetch("/api/projects", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: project.id,
      name: project.name,
      initiativeId: project.initiativeId,
      deadline: project.deadline,
    }),
  });

  if (putResponse.ok) return;

  if (putResponse.status === 404) {
    const postResponse = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        initiativeId: project.initiativeId,
        deadline: project.deadline,
      }),
    });

    if (!postResponse.ok) {
      console.error("Failed to create project via API:", await postResponse.text());
    }

    return;
  }

  console.error("Failed to save project via API:", await putResponse.text());
}

async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}`, { method: "DELETE" });

  if (!response.ok) {
    console.error("Failed to delete project via API:", await response.text());
  }
}

// ---------------------------------------------------------------------------
// Initiatives
// ---------------------------------------------------------------------------

async function saveInitiative(initiative: Initiative): Promise<void> {
  const putResponse = await fetch("/api/initiatives", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: initiative.id,
      name: initiative.name,
      description: initiative.description,
      deadline: initiative.deadline,
    }),
  });

  if (putResponse.ok) return;

  if (putResponse.status === 404) {
    const postResponse = await fetch("/api/initiatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: initiative.id,
        name: initiative.name,
        description: initiative.description,
        deadline: initiative.deadline,
      }),
    });

    if (!postResponse.ok) {
      console.error("Failed to create initiative via API:", await postResponse.text());
    }

    return;
  }

  console.error("Failed to save initiative via API:", await putResponse.text());
}

async function deleteInitiative(initiativeId: string): Promise<void> {
  const response = await fetch(`/api/initiatives?id=${encodeURIComponent(initiativeId)}`, { method: "DELETE" });

  if (!response.ok) {
    console.error("Failed to delete initiative via API:", await response.text());
  }
}

// ---------------------------------------------------------------------------
// Thread messages
// ---------------------------------------------------------------------------

async function saveThreadMessage(owner: ThreadOwnerRef, message: AgentThreadMessage): Promise<void> {
  const threadId = `thread-${owner.ownerType}-${owner.ownerId}`;

  const response = await fetch(`/api/threads/${encodeURIComponent(owner.ownerId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId,
      ownerType: owner.ownerType,
      messageId: message.id,
      role: message.role,
      content: message.content,
      providerId: message.providerId,
      model: message.model,
      status: message.status,
      createdAt: message.createdAt,
    }),
  });

  if (!response.ok) {
    console.error("Failed to save thread message via API:", await response.text());
  }
}

async function deleteThreadMessage(owner: ThreadOwnerRef, messageId: string): Promise<void> {
  const response = await fetch(
    `/api/threads/${encodeURIComponent(owner.ownerId)}?messageId=${encodeURIComponent(messageId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    console.error("Failed to delete thread message via API:", await response.text());
  }
}
