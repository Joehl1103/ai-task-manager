import type {
  AgentThreadMessage,
  Initiative,
  Project,
  Task,
  ThreadOwnerRef,
  WorkspaceSnapshot,
} from "@/features/workspace/core";
import { getSupabaseClient } from "@/lib/supabase/client";
import { normalizeWorkspaceSnapshot } from "./workspace-storage";
import type { WorkspacePersistence } from "./workspace-persistence";

/**
 * Persists workspace data via the Supabase JS client — bypasses the Next.js
 * API routes entirely. Required for Tauri (no server) and works in browser too.
 *
 * Uses upsert for saves (insert-or-update) so callers don't need to track
 * whether a record already exists.
 */
export function createSupabasePersistence(): WorkspacePersistence {
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
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the configured Supabase client or throws if env vars are missing.
 * This prevents subtle no-ops when the client silently returns null.
 */
function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}

// ---------------------------------------------------------------------------
// Workspace snapshot
// ---------------------------------------------------------------------------

/**
 * Loads the full workspace from Supabase in parallel — one query per table —
 * then assembles the result into the app's WorkspaceSnapshot shape.
 *
 * Thread messages are loaded separately and joined to their threads by threadId.
 */
async function loadWorkspace(): Promise<WorkspaceSnapshot> {
  const client = requireClient();

  const [initiativesRes, projectsRes, tasksRes, threadsRes, messagesRes] =
    await Promise.all([
      client.from("initiatives").select("*"),
      client.from("projects").select("*"),
      client.from("tasks").select("*"),
      client.from("agent_threads").select("*"),
      client.from("agent_thread_messages").select("*"),
    ]);

  // Surface the first error we encounter across any query
  const firstError =
    initiativesRes.error ??
    projectsRes.error ??
    tasksRes.error ??
    threadsRes.error ??
    messagesRes.error;

  if (firstError) throw new Error(firstError.message);

  const dbInitiatives = initiativesRes.data ?? [];
  const dbProjects = projectsRes.data ?? [];
  const dbTasks = tasksRes.data ?? [];
  const dbThreads = threadsRes.data ?? [];
  const dbMessages = messagesRes.data ?? [];

  // Group messages by threadId for quick lookup
  const messagesByThreadId = groupBy(dbMessages, (m) => m.thread_id);

  // Build thread lookup by ownerId
  const threadByOwnerId = new Map(
    dbThreads.map((t) => [
      t.owner_id,
      {
        id: t.id,
        ownerType: t.owner_type,
        ownerId: t.owner_id,
        messages: (messagesByThreadId[t.id] ?? []).map(dbMessageToApp),
      },
    ]),
  );

  const emptyThread = (ownerType: string, ownerId: string) => ({
    id: `thread-${ownerType}-${ownerId}`,
    ownerType,
    ownerId,
    messages: [],
  });

  // Map DB rows to app shapes, attaching thread data
  const raw = {
    initiatives: dbInitiatives.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description ?? "",
      deadline: i.deadline ?? "",
      agentThread: threadByOwnerId.get(i.id) ?? emptyThread("initiative", i.id),
    })),
    projects: dbProjects.map((p) => ({
      id: p.id,
      name: p.name,
      initiativeId: p.initiative_id ?? "",
      deadline: p.deadline ?? "",
      agentThread: threadByOwnerId.get(p.id) ?? emptyThread("project", p.id),
    })),
    tasks: dbTasks.map((t) => ({
      id: t.id,
      title: t.title,
      details: t.details ?? "",
      completed: t.completed ?? false,
      projectId: t.project_id ?? "",
      dueBy: t.due_by ?? "",
      remindOn: t.remind_on ?? "",
      tags: t.tags ?? [],
      createdAt: t.created_at ? String(t.created_at) : "",
      completedAt: t.completed_at ?? "",
      agentThread: threadByOwnerId.get(t.id) ?? emptyThread("task", t.id),
    })),
  };

  return normalizeWorkspaceSnapshot(raw);
}

/** Maps a DB agent_thread_messages row to the app's AgentThreadMessage type. */
function dbMessageToApp(m: Record<string, unknown>) {
  return {
    id: String(m.id),
    role: String(m.role) as "human" | "agent",
    content: String(m.content),
    createdAt: m.created_at ? String(m.created_at) : "",
    providerId: m.provider_id ? String(m.provider_id) : undefined,
    model: m.model ? String(m.model) : undefined,
    status: m.status ? String(m.status) : undefined,
  };
}

/** Groups an array into a Record by the result of keyFn. */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFn(item);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/**
 * Upserts a task — inserts if new, updates if existing (matched by id).
 */
async function saveTask(task: Task): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("tasks").upsert({
    id: task.id,
    title: task.title,
    details: task.details,
    completed: task.completed,
    project_id: task.projectId || null,
    deadline: task.dueBy,
    tags: task.tags,
    completed_at: task.completedAt,
    remind_on: task.remindOn,
    due_by: task.dueBy,
  });

  if (error) console.error("Failed to save task:", error.message);
}

async function deleteTask(taskId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("tasks").delete().eq("id", taskId);
  if (error) console.error("Failed to delete task:", error.message);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

async function saveProject(project: Project): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("projects").upsert({
    id: project.id,
    name: project.name,
    initiative_id: project.initiativeId || null,
    deadline: project.deadline,
  });
  if (error) console.error("Failed to save project:", error.message);
}

async function deleteProject(projectId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("projects").delete().eq("id", projectId);
  if (error) console.error("Failed to delete project:", error.message);
}

// ---------------------------------------------------------------------------
// Initiatives
// ---------------------------------------------------------------------------

async function saveInitiative(initiative: Initiative): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("initiatives").upsert({
    id: initiative.id,
    name: initiative.name,
    description: initiative.description,
    deadline: initiative.deadline,
  });
  if (error) console.error("Failed to save initiative:", error.message);
}

async function deleteInitiative(initiativeId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("initiatives").delete().eq("id", initiativeId);
  if (error) console.error("Failed to delete initiative:", error.message);
}

// ---------------------------------------------------------------------------
// Thread messages
// ---------------------------------------------------------------------------

/**
 * Ensures the agent thread row exists (upsert), then inserts the message.
 * The thread id is deterministic: `thread-{ownerType}-{ownerId}`.
 */
async function saveThreadMessage(
  owner: ThreadOwnerRef,
  message: AgentThreadMessage,
): Promise<void> {
  const client = requireClient();
  const threadId = `thread-${owner.ownerType}-${owner.ownerId}`;

  // Upsert thread row — no-op if it already exists
  const { error: threadError } = await client.from("agent_threads").upsert({
    id: threadId,
    owner_type: owner.ownerType,
    owner_id: owner.ownerId,
  });
  if (threadError) {
    console.error("Failed to upsert thread:", threadError.message);
    return;
  }

  // Insert the message
  const { error: msgError } = await client.from("agent_thread_messages").insert({
    id: message.id,
    thread_id: threadId,
    role: message.role,
    content: message.content,
    provider_id: message.providerId ?? null,
    model: message.model ?? null,
    status: message.status ?? null,
    created_at: message.createdAt,
  });
  if (msgError) console.error("Failed to insert thread message:", msgError.message);
}

async function deleteThreadMessage(
  _owner: ThreadOwnerRef,
  messageId: string,
): Promise<void> {
  const client = requireClient();
  // Messages have globally unique IDs — no need to filter by ownerId
  const { error } = await client.from("agent_thread_messages").delete().eq("id", messageId);
  if (error) console.error("Failed to delete thread message:", error.message);
}
