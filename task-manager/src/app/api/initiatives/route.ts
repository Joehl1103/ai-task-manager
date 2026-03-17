import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb, initiatives } from "@/db";

export async function GET() {
  try {
    const db = getDb();
    const allInitiatives = await db
      .select()
      .from(initiatives)
      .orderBy(initiatives.createdAt);
    
    return NextResponse.json(allInitiatives);
  } catch (error) {
    console.error("Failed to fetch initiatives:", error);
    return NextResponse.json(
      { error: "Failed to fetch initiatives" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, description, deadline } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [newInitiative] = await db
      .insert(initiatives)
      .values({
        name: name.trim(),
        description: description?.trim() || "",
        deadline: deadline?.trim() || "",
      })
      .returning();

    return NextResponse.json(newInitiative, { status: 201 });
  } catch (error) {
    console.error("Failed to create initiative:", error);
    return NextResponse.json(
      { error: "Failed to create initiative" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, description, deadline } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(initiatives)
      .set({
        name: name.trim(),
        description: description?.trim() || "",
        deadline: deadline?.trim() || "",
        updatedAt: new Date(),
      })
      .where(eq(initiatives.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Initiative not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update initiative:", error);
    return NextResponse.json(
      { error: "Failed to update initiative" },
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
      .delete(initiatives)
      .where(eq(initiatives.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Initiative not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete initiative:", error);
    return NextResponse.json(
      { error: "Failed to delete initiative" },
      { status: 500 }
    );
  }
}
