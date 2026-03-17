import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb, tasks, agentCalls } from "@/db";

export async function GET() {
  try {
    const db = getDb();
    const allTasks = await db
      .select()
      .from(tasks)
      .orderBy(tasks.createdAt);

    const allAgentCalls = await db
      .select()
      .from(agentCalls)
      .orderBy(agentCalls.createdAt);

    // Group agent calls by task
    const agentCallsByTask = new Map<string, typeof allAgentCalls>();
    for (const call of allAgentCalls) {
      const existing = agentCallsByTask.get(call.taskId) || [];
      agentCallsByTask.set(call.taskId, [...existing, call]);
    }

    // Combine tasks with their agent calls
    const tasksWithCalls = allTasks.map((task) => ({
      ...task,
      agentCalls: agentCallsByTask.get(task.id) || [],
    }));

    return NextResponse.json(tasksWithCalls);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { title, details, projectId, tags } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    const [newTask] = await db
      .insert(tasks)
      .values({
        title: title.trim(),
        details: details?.trim() || "",
        projectId: projectId || null,
        tags: normalizedTags,
      })
      .returning();

    return NextResponse.json({ ...newTask, agentCalls: [] }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, title, details, projectId, tags } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    const [updated] = await db
      .update(tasks)
      .set({
        title: title.trim(),
        details: details?.trim() || "",
        projectId: projectId || null,
        tags: normalizedTags,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Fetch agent calls for this task
    const taskAgentCalls = await db
      .select()
      .from(agentCalls)
      .where(eq(agentCalls.taskId, id))
      .orderBy(agentCalls.createdAt);

    return NextResponse.json({ ...updated, agentCalls: taskAgentCalls });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
