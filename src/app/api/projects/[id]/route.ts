import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { internalServerError, notFoundError, pickDefined, readJsonObject } from "@/app/api/_shared";
import { getDb, projects } from "@/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [project] = await db.select().from(projects).where(eq(projects.id, id));

    if (!project) {
      return notFoundError("Project not found.");
    }

    return NextResponse.json(project);
  } catch (error) {
    return internalServerError("Failed to fetch project.", error);
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
      .update(projects)
      .set(
        pickDefined({
          name: typeof body.name === "string" ? body.name.trim() : undefined,
          initiativeId: typeof body.initiativeId === "string" ? body.initiativeId.trim() : undefined,
          deadline: typeof body.deadline === "string" ? body.deadline.trim() : undefined,
          updatedAt: new Date(),
        }),
      )
      .where(eq(projects.id, id))
      .returning();

    if (!updated) {
      return notFoundError("Project not found.");
    }

    return NextResponse.json(updated);
  } catch (error) {
    return internalServerError("Failed to update project.", error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();

    if (!deleted) {
      return notFoundError("Project not found.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("Failed to delete project.", error);
  }
}
