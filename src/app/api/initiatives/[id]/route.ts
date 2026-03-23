import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { internalServerError, notFoundError, pickDefined, readJsonObject } from "@/app/api/_shared";
import { getDb, initiatives } from "@/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [initiative] = await db.select().from(initiatives).where(eq(initiatives.id, id));

    if (!initiative) {
      return notFoundError("Initiative not found.");
    }

    return NextResponse.json(initiative);
  } catch (error) {
    return internalServerError("Failed to fetch initiative.", error);
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
      .update(initiatives)
      .set(
        pickDefined({
          name: typeof body.name === "string" ? body.name.trim() : undefined,
          description: typeof body.description === "string" ? body.description.trim() : undefined,
          deadline: typeof body.deadline === "string" ? body.deadline.trim() : undefined,
          updatedAt: new Date(),
        }),
      )
      .where(eq(initiatives.id, id))
      .returning();

    if (!updated) {
      return notFoundError("Initiative not found.");
    }

    return NextResponse.json(updated);
  } catch (error) {
    return internalServerError("Failed to update initiative.", error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [deleted] = await db.delete(initiatives).where(eq(initiatives.id, id)).returning();

    if (!deleted) {
      return notFoundError("Initiative not found.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("Failed to delete initiative.", error);
  }
}
