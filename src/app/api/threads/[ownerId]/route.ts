import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

import { internalServerError, notFoundError, readJsonObject, validationError } from "@/app/api/_shared";
import { getDb, agentThreads, agentThreadMessages } from "@/db";

/**
 * Returns the thread and its messages for a given owner entity.
 * The ownerId doubles as the thread lookup key via the owner_id column.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ ownerId: string }> }) {
  try {
    const { ownerId } = await params;
    const db = getDb();

    const [thread] = await db
      .select()
      .from(agentThreads)
      .where(eq(agentThreads.ownerId, ownerId));

    if (!thread) {
      return NextResponse.json({ thread: null, messages: [] });
    }

    const messages = await db
      .select()
      .from(agentThreadMessages)
      .where(eq(agentThreadMessages.threadId, thread.id))
      .orderBy(agentThreadMessages.createdAt);

    return NextResponse.json({ thread, messages });
  } catch (error) {
    return internalServerError("Failed to fetch thread.", error);
  }
}

/**
 * Appends a message to an entity's thread. Creates the thread if it does not exist.
 * Expects body: { threadId, ownerType, ownerId, messageId, role, content, providerId?, model?, status?, createdAt }
 */
export async function POST(request: Request, { params }: { params: Promise<{ ownerId: string }> }) {
  try {
    const { ownerId } = await params;
    const db = getDb();
    const json = await readJsonObject(request);
    if (!json.ok) return json.response;
    const body = json.value;
    const { threadId, ownerType, messageId, role, content, providerId, model, status, createdAt } = body;

    const fields: Record<string, string> = {};
    if (!threadId) fields.threadId = "required";
    if (!ownerType) fields.ownerType = "required";
    if (!messageId) fields.messageId = "required";
    if (!role) fields.role = "required";
    if (!content) fields.content = "required";
    if (Object.keys(fields).length > 0) {
      return validationError("Required fields are missing.", fields);
    }

    // Upsert thread — create if missing
    const [existingThread] = await db
      .select()
      .from(agentThreads)
      .where(eq(agentThreads.id, threadId));

    if (!existingThread) {
      await db.insert(agentThreads).values({ id: threadId, ownerType, ownerId });
    }

    // Insert the message
    const [newMessage] = await db
      .insert(agentThreadMessages)
      .values({
        id: messageId,
        threadId,
        role,
        content,
        providerId: providerId || null,
        model: model || null,
        status: status || null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      })
      .returning();

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return internalServerError("Failed to append thread message.", error);
  }
}

/**
 * Deletes a single message from a thread. Message id is passed as query param.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ ownerId: string }> }) {
  try {
    const { ownerId } = await params;
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return validationError("messageId query param is required.", { messageId: "required" });
    }

    // Find the thread for this owner first
    const [thread] = await db
      .select()
      .from(agentThreads)
      .where(eq(agentThreads.ownerId, ownerId));

    if (!thread) {
      return notFoundError("Thread not found.");
    }

    const [deleted] = await db
      .delete(agentThreadMessages)
      .where(and(eq(agentThreadMessages.id, messageId), eq(agentThreadMessages.threadId, thread.id)))
      .returning();

    if (!deleted) {
      return notFoundError("Message not found.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("Failed to delete thread message.", error);
  }
}
