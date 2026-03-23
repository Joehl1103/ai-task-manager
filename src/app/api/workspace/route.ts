import { NextResponse } from "next/server";

import { getDb, tasks, projects, initiatives, agentThreads, agentThreadMessages } from "@/db";

/**
 * Returns a full WorkspaceSnapshot by assembling tasks, projects, initiatives,
 * and their associated agent threads from the database. This is the single
 * hydration call that replaces localStorage reads on mount.
 */
export async function GET() {
  try {
    const db = getDb();

    // Fetch all entities and threads in parallel
    const [allTasks, allProjects, allInitiatives, allThreads, allMessages] = await Promise.all([
      db.select().from(tasks).orderBy(tasks.createdAt),
      db.select().from(projects).orderBy(projects.createdAt),
      db.select().from(initiatives).orderBy(initiatives.createdAt),
      db.select().from(agentThreads),
      db.select().from(agentThreadMessages).orderBy(agentThreadMessages.createdAt),
    ]);

    // Group messages by thread id
    const messagesByThreadId = new Map<string, typeof allMessages>();

    for (const message of allMessages) {
      const existing = messagesByThreadId.get(message.threadId) ?? [];
      messagesByThreadId.set(message.threadId, [...existing, message]);
    }

    // Build a lookup from ownerId → thread with messages
    const threadByOwnerId = new Map<
      string,
      { id: string; ownerType: string; ownerId: string; messages: typeof allMessages }
    >();

    for (const thread of allThreads) {
      threadByOwnerId.set(thread.ownerId, {
        id: thread.id,
        ownerType: thread.ownerType,
        ownerId: thread.ownerId,
        messages: messagesByThreadId.get(thread.id) ?? [],
      });
    }

    // Assemble entities with their threads in the app's expected shape
    const assembledTasks = allTasks.map((task) => {
      const thread = threadByOwnerId.get(task.id);

      return {
        id: task.id,
        title: task.title,
        details: task.details,
        completed: task.completed,
        projectId: task.projectId ?? "",
        deadline: task.deadline,
        tags: task.tags,
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt,
        remindOn: task.remindOn,
        dueBy: task.dueBy,
        agentThread: thread
          ? {
              id: thread.id,
              ownerType: thread.ownerType,
              ownerId: thread.ownerId,
              messages: thread.messages.map(formatMessage),
            }
          : { id: `thread-task-${task.id}`, ownerType: "task", ownerId: task.id, messages: [] },
      };
    });

    const assembledProjects = allProjects.map((project) => {
      const thread = threadByOwnerId.get(project.id);

      return {
        id: project.id,
        name: project.name,
        initiativeId: project.initiativeId ?? "",
        deadline: project.deadline,
        agentThread: thread
          ? {
              id: thread.id,
              ownerType: thread.ownerType,
              ownerId: thread.ownerId,
              messages: thread.messages.map(formatMessage),
            }
          : { id: `thread-project-${project.id}`, ownerType: "project", ownerId: project.id, messages: [] },
      };
    });

    const assembledInitiatives = allInitiatives.map((initiative) => {
      const thread = threadByOwnerId.get(initiative.id);

      return {
        id: initiative.id,
        name: initiative.name,
        description: initiative.description,
        deadline: initiative.deadline,
        agentThread: thread
          ? {
              id: thread.id,
              ownerType: thread.ownerType,
              ownerId: thread.ownerId,
              messages: thread.messages.map(formatMessage),
            }
          : {
              id: `thread-initiative-${initiative.id}`,
              ownerType: "initiative",
              ownerId: initiative.id,
              messages: [],
            },
      };
    });

    return NextResponse.json({
      initiatives: assembledInitiatives,
      projects: assembledProjects,
      tasks: assembledTasks,
    });
  } catch (error) {
    console.error("Failed to fetch workspace:", error);
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 });
  }
}

/**
 * Formats a DB thread message row into the shape the app expects.
 */
function formatMessage(row: {
  id: string;
  role: string;
  content: string;
  providerId: string | null;
  model: string | null;
  status: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    ...(row.providerId ? { providerId: row.providerId } : {}),
    ...(row.model ? { model: row.model } : {}),
    ...(row.status ? { status: row.status } : {}),
  };
}
