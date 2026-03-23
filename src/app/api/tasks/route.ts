import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb, tasks } from "@/db";

/**
 * Returns all tasks ordered by creation date.
 */
export async function GET() {
  try {
    const db = getDb();
    const allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);

    return NextResponse.json(allTasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

/**
 * Creates a new task. The caller supplies the app-generated id.
 */
export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, title, details, completed, projectId, deadline, tags, completedAt, remindOn, dueBy } = body;

    if (!id || !title?.trim()) {
      return NextResponse.json({ error: "id and title are required" }, { status: 400 });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    const [newTask] = await db
      .insert(tasks)
      .values({
        id,
        title: title.trim(),
        details: details?.trim() || "",
        completed: completed ?? false,
        projectId: projectId || null,
        deadline: deadline?.trim() || "",
        tags: normalizedTags,
        completedAt: completedAt || "",
        remindOn: remindOn || "",
        dueBy: dueBy?.trim() || deadline?.trim() || "",
      })
      .returning();

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

/**
 * Updates an existing task by id (supplied in body).
 */
export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, title, details, completed, projectId, deadline, tags, completedAt, remindOn, dueBy } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    const [updated] = await db
      .update(tasks)
      .set({
        title: title?.trim() || undefined,
        details: details?.trim() ?? undefined,
        completed: completed ?? undefined,
        projectId: projectId ?? undefined,
        deadline: deadline?.trim() ?? undefined,
        tags: Array.isArray(tags) ? normalizedTags : undefined,
        completedAt: completedAt ?? undefined,
        remindOn: remindOn ?? undefined,
        dueBy: dueBy?.trim() || deadline?.trim() || undefined,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

/**
 * Deletes a task by id (query parameter).
 */
export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
