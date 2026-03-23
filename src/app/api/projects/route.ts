import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb, projects } from "@/db";

/**
 * Returns all projects ordered by creation date.
 */
export async function GET() {
  try {
    const db = getDb();
    const allProjects = await db.select().from(projects).orderBy(projects.createdAt);

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

/**
 * Creates a new project. The caller supplies the app-generated id.
 */
export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, initiativeId, deadline } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        id,
        name: name.trim(),
        initiativeId: initiativeId || null,
        deadline: deadline?.trim() || "",
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

/**
 * Updates an existing project by id (supplied in body).
 */
export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, initiativeId, deadline } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(projects)
      .set({
        name: name?.trim() || undefined,
        initiativeId: initiativeId ?? undefined,
        deadline: deadline?.trim() ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

/**
 * Deletes a project by id (query parameter).
 */
export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
