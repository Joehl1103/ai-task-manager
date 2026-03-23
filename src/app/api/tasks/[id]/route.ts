import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { internalServerError, notFoundError, pickDefined, readJsonObject } from "@/app/api/_shared";
import { agentThreadMessages, agentThreads, getDb, tasks } from "@/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));

    if (!task) {
      return notFoundError("Task not found.");
    }

    const [thread] = await db.select().from(agentThreads).where(eq(agentThreads.ownerId, id));

    const messages = thread
      ? await db
          .select()
          .from(agentThreadMessages)
          .where(eq(agentThreadMessages.threadId, thread.id))
          .orderBy(agentThreadMessages.createdAt)
      : [];

    return NextResponse.json({
      ...task,
      agentThread: thread
        ? {
            id: thread.id,
            ownerType: thread.ownerType,
            ownerId: thread.ownerId,
            messages,
          }
        : {
            id: `thread-task-${task.id}`,
            ownerType: "task",
            ownerId: task.id,
            messages: [],
          },
    });
  } catch (error) {
    return internalServerError("Failed to fetch task.", error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const json = await readJsonObject(request);

    if (!json.ok) {
      return json.response;
    }

    const body = json.value;
    const db = getDb();

    const [updated] = await db
      .update(tasks)
      .set(
        pickDefined({
          title: typeof body.title === "string" ? body.title.trim() : undefined,
          details: typeof body.details === "string" ? body.details.trim() : undefined,
          completed: typeof body.completed === "boolean" ? body.completed : undefined,
          projectId: typeof body.projectId === "string" ? body.projectId : undefined,
          deadline: typeof body.deadline === "string" ? body.deadline.trim() : undefined,
          tags: Array.isArray(body.tags) ? body.tags.filter((entry): entry is string => typeof entry === "string") : undefined,
          completedAt: typeof body.completedAt === "string" ? body.completedAt : undefined,
          remindOn: typeof body.remindOn === "string" ? body.remindOn : undefined,
          dueBy: typeof body.dueBy === "string" ? body.dueBy : undefined,
          updatedAt: new Date(),
        }),
      )
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) {
      return notFoundError("Task not found.");
    }

    return NextResponse.json(updated);
  } catch (error) {
    return internalServerError("Failed to update task.", error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();

    if (!deleted) {
      return notFoundError("Task not found.");
    }

    const [thread] = await db.select().from(agentThreads).where(eq(agentThreads.ownerId, id));

    if (thread) {
      await db.delete(agentThreadMessages).where(eq(agentThreadMessages.threadId, thread.id)).returning();
      await db.delete(agentThreads).where(and(eq(agentThreads.id, thread.id), eq(agentThreads.ownerId, id))).returning();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("Failed to delete task.", error);
  }
}
